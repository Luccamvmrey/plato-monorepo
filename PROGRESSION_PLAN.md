# Progressão de carga prescritiva no treino ativo

## Context

Hoje o Plato guarda tudo o que é necessário para decidir progressão de carga — peso, reps e RPE por set — mas não faz nada com isso além de tentar repetir o peso da última vez (e esse prefill está quebrado). Isso é memória, não progressão.

O objetivo é substituir a memória por uma **prescrição**: uma função determinística que, dado o histórico recente de um exercício, responde "sobe / mantém / segura / deload", com peso e reps concretos e uma razão legível — e integra isso ao treino ativo, alimentando o prefill dos inputs e um indicador visual no card do exercício.

Decisões já tomadas com o usuário:
- **Motor:** híbrido — dupla progressão (faixa de reps) como regra, RPE como veto.
- **Rigidez:** avisa e marca o desvio, sem bloquear.
- **Escopo:** núcleo — histórico + veredito + prefill + chip no card. Fora: tela de configuração por exercício, bloco "na próxima sessão" no resumo, reavaliação ao vivo dentro da sessão.

## Decisões de arquitetura

**Zero migração de banco.** Nenhum campo novo. Motivos:
- `workout.service.ts:60-81` (`update`) faz `deleteMany` + `createMany` de todas as `WorkoutExercise` dentro de uma transação, então os ids não são estáveis e qualquer config gravada ali seria apagada ao editar o treino. Config por exercício, se um dia existir, precisa de um modelo próprio chaveado por `(userId, exerciseId)` — fora do escopo agora.
- A faixa de reps e o incremento de carga são **derivados**: faixa = `[targetReps, targetReps + 2]`; incremento = menor delta positivo observado no histórico de pesos daquele exercício, com fallback por faixa de carga.

**O veredito é uma função pura no cliente** (`features/workouts/utils/progression.ts`, irmã de `utils/analytics.ts`), não um endpoint. Respeita a regra do CLAUDE.md de não persistir estado derivado, é testável isoladamente, e permite reavaliar sem round-trip. O backend só entrega dados crus.

**Um único fetch de histórico por sessão, não um por exercício.** O prefill atual provavelmente falha por corrida (o input inicializa antes do dado chegar). Buscar o histórico de todos os exercícios do treino de uma vez, no início da sessão, elimina a corrida na raiz em vez de remendá-la com efeitos.

**RPE 8 é o default do seletor** (`useActiveSetInput.ts:10`, `DEFAULT_RPE = "8"`), não uma afirmação do usuário. Portanto: teto para liberar aumento é `maxRpe <= 8` (o default nunca bloqueia), veto real começa em 9, e 10 é sinal de recuo.

---

## Parte 1 — Backend: endpoint de histórico por treino

### `apps/api/src/modules/workout-session/workout-session.service.ts`

Nova função `getExerciseHistoryByWorkout(userId, workoutId, limit = 4)`:

```ts
// Últimas N execuções completas de cada exercício do treino, agrupadas por exerciseId.
// Alimenta a prescrição de carga no treino ativo.
```

- Busca as `workoutSession` do usuário com `workoutId` e `completedAt: { not: null }`, `orderBy: { completedAt: "desc" }`, `take: limit`.
- `include: { sessionSet: { orderBy: { setNumber: "asc" }, select: { id, exerciseId, setNumber, actualReps, actualWeight, equipmentWeight, rpe } } }`.
  - O `orderBy` em `sessionSet` é importante: **nenhuma query do repositório ordena sets hoje**, e `SessionSet` não tem timestamp — a única ordem confiável é `setNumber`.
  - Usar `select` em vez de `include: { exercise: true }` — o endpoint existente duplica a linha inteira de `Exercise` em cada set desnecessariamente.
- Reagrupa em memória para a resposta:

```ts
type ExerciseExecution = {
  sessionId: number;
  completedAt: string;
  sets: { setNumber: number; actualReps: number; actualWeight: number; equipmentWeight: number | null; rpe: number }[];
};
// resposta: Record<string /* exerciseId */, ExerciseExecution[]>  — cada lista do mais recente para o mais antigo
```

Limitação aceita e a documentar no código: o histórico é escopado ao **treino**, não ao exercício global. Se o mesmo exercício aparece em dois treinos, cada um progride independentemente. É o comportamento desejado (volume e frequência diferem por treino) e mantém o fetch em uma query só.

### `apps/api/src/modules/workout-session/workout-session.controller.ts`
`getExerciseHistory` seguindo o preâmbulo canônico: `getUserId(req)` + `extractId(req)` (`shared/utils/request.ts`), `limit` lido de `req.query` com clamp `[1, 10]` e fallback 4 (não há helper de validação de query no projeto — validar inline).

### `apps/api/src/modules/workout-session/workout-session.routes.ts`
`router.get("/workout/:id/exercise-history", controller.getExerciseHistory);`
Declarar **antes** de `GET /:id` (linha 18). O router já tem `router.use(authenticate)` no topo — nada a adicionar.

---

## Parte 2 — A função de veredito

### `apps/web/src/features/workouts/utils/progression.ts` (novo)

Puro, sem React, sem imports além de tipos. Espelha o estilo de `utils/analytics.ts`.

```ts
export type ProgressionVerdict = "INCREASE" | "HOLD" | "REPEAT" | "DELOAD" | "NO_HISTORY";

export interface ProgressionAdvice {
  verdict: ProgressionVerdict;
  suggestedWeight: number | null;      // null só em NO_HISTORY
  suggestedEquipmentWeight: number;    // repete o da última execução
  suggestedReps: number;
  repRange: { min: number; max: number };
  increment: number;
  reason: string;                      // pt-BR, uma linha, com números
  stalledSessions: number;
}

export function getProgressionAdvice(
  history: ExerciseExecution[],   // mais recente primeiro
  targetReps: number,
): ProgressionAdvice
```

**Helpers internos** (exportados para teste):
- `REP_RANGE_SPREAD = 2` → `repRange = { min: targetReps, max: targetReps + 2 }`.
- `inferIncrement(history, workWeight)` — pesos distintos usados no histórico, ordenados; menor diferença positiva; clamp `[1, 10]`. Fallback quando há menos de dois pesos distintos: `workWeight < 20 → 1`, `< 60 → 2.5`, senão `5`.
- `summarizeExecution(exec)` → `{ workWeight, minReps, maxRpe, equipmentWeight }`, onde `workWeight` é o peso mais frequente entre os sets (empate → o menor, conservador), `minReps` o mínimo de reps entre os sets nesse peso, `maxRpe` o máximo de RPE nesse peso.
- `countStall(history, workWeight)` — quantas execuções consecutivas, do topo para baixo, usaram o mesmo `workWeight` sem melhorar `minReps`.
- `roundToIncrement(value, increment)` — arredonda para o múltiplo mais próximo, com uma casa decimal.

**Regras, em ordem de precedência:**

| # | Condição | Veredito | Sugestão | Razão (exemplo) |
|---|---|---|---|---|
| 1 | `history` vazio | `NO_HISTORY` | peso `null`, reps `range.min` | "Primeira vez neste exercício — registre uma carga de referência." |
| 2 | `stalledSessions >= 3 && maxRpe >= 9` | `DELOAD` | `round(workWeight * 0.9)`, reps `range.min` | "3 sessões travado em 40 kg com RPE 9 — recue para 36 kg e reconstrua." |
| 3 | `minReps >= range.max && maxRpe <= 8` | `INCREASE` | `workWeight + increment`, reps `range.min` | "Você fechou 3×12 em 40 kg com RPE 8 — suba para 42,5 kg." |
| 4 | `maxRpe >= 10 \|\| minReps < range.min` | `REPEAT` | mesmo peso, reps `range.min` | "Última execução saiu a RPE 10 — repita 40 kg antes de subir." |
| 5 | resto | `HOLD` | mesmo peso, reps `min(minReps + 1, range.max)` | "Mantenha 40 kg e busque 11 reps (faltam 2 para o topo da faixa)." |

Notas de comportamento:
- Regra 3 é a dupla progressão; regra 4 é o veto por RPE. Com o default de RPE 8, a regra 3 permanece alcançável sem o usuário tocar no seletor — intencional.
- `suggestedEquipmentWeight` sempre repete o da última execução, para que o toggle "Adicionar Barra" não perca o valor entre sessões.
- Nenhum arredondamento agressivo: `roundToIncrement` mantém uma casa decimal, coerente com o `parseDecimal` pt-BR de `useActiveSetInput.ts:15`.

---

## Parte 3 — Camada de dados no cliente

### `apps/web/src/features/workouts/services/workout-session/workout-session.service.ts`
Adicionar `getExerciseHistory(workoutId, limit?)` seguindo o padrão do arquivo (objeto literal de arrow functions async, `const { data } = await api.get(...)`). Exportar o tipo `ExerciseHistoryMap` do mesmo arquivo, como os outros payloads.

### `apps/web/src/features/workouts/hooks/useExerciseHistory.ts` (novo)
```ts
useQuery({
  queryKey: ["exercise-history", workoutId],
  queryFn: () => WorkoutSessionService.getExerciseHistory(workoutId),
  enabled: !!workoutId,
  staleTime: Infinity,   // o histórico não muda durante a sessão
})
```
`staleTime: Infinity` é deliberado: nada dentro da sessão ativa pode alterar sessões já concluídas, e um refetch no meio do treino trocaria a prescrição debaixo do usuário. Invalidar apenas em `finishSession` (adicionar `["exercise-history"]` ao `invalidateQueries` da mutation que finaliza a sessão).

### `apps/web/src/features/workouts/hooks/useActiveWorkoutLogic.ts`
Montar `useExerciseHistory(activeSession.workoutId)` aqui — um fetch por sessão — e propagar o mapa para baixo. Este hook já é o intermediário obrigatório entre a página e os hooks de sessão (registrado no cerebrum), então qualquer estado novo precisa passar por ele.

### `apps/web/src/features/workouts/hooks/useActiveExerciseCardLogic.ts`
Derivar o `advice` com `useMemo`:
```ts
const advice = useMemo(
  () => getProgressionAdvice(history?.[record.exerciseId] ?? [], record.targetReps),
  [history, record.exerciseId, record.targetReps],
);
```
e devolvê-lo junto com o que já retorna. **`suggestions` (de `useExerciseSuggestions`) é substituído por `advice`** — a prescrição é um superconjunto do que ele fazia. Remover `useExerciseSuggestions.ts` e seu consumo se ele não tiver outro chamador.

### Por que o prefill está quebrado hoje

A causa é estrutural, não de timing, e a Parte 1 já a resolve — mas há duas correções que precisam ser feitas explicitamente:

1. **A fonte de dados é a errada.** `useExerciseSuggestions.ts:21-27` só olha `lastSession` — **uma única** sessão, escopada ao `workoutId` (`workout-session.service.ts:97-105`). Fica vazia sempre que a execução anterior daquele treino não registrou aquele exercício: exercício adicionado ao plano depois, pulado, trocado, treino finalizado cedo pelo `FinishWorkoutDialog`, ou sessão cancelada/abandonada — e uma sessão que não é finalizada **não grava nenhum `SessionSet`**, porque a persistência é toda em lote no finish (`useSessionSet.ts:9-11` só chama `addPendingSet`). O mapa de histórico da Parte 1 substitui essa fonte por completo.
2. **Prefill de reps nunca existiu.** `useExerciseSuggestions` retorna só `{ weight, equipWeight }`; reps sempre vêm de `record.targetReps` e o efeito de `useActiveSetInput.ts:66-73` *reseta* reps e RPE a cada troca de set (deliberado, commit `e485c60`). `advice.suggestedReps` passa a alimentar isso.
3. **Guardas de truthiness engolem `0` kg legítimo** — `useExerciseSuggestions.ts:26-27`, `useActiveSetInput.ts:34` e `:53` usam `||` / `if (previousWeight)`. Peso corporal e máquina assistida nunca preenchem. Trocar por checagem de `!= null` em todos os três pontos.

### `apps/web/src/features/workouts/hooks/useActiveSetInput.ts`
- Trocar as props `previousWeight`/`previousEquipmentWeight` por `advice: ProgressionAdvice`, e semear `weight`/`reps`/`equipmentWeight` a partir dele.
- **Corrigir o stomping do efeito A** (`:50-59`): hoje `previousWeight` é dependência, então um valor que chega ou muda no meio da digitação sobrescreve o que o usuário já escreveu. Substituir por um ref que guarda o par `(exerciseId, setNumber)` já semeado: semear quando o par ainda não foi semeado **e** o advice deixou de ser `NO_HISTORY`; nunca semear duas vezes o mesmo par. Isso cobre a chegada tardia sem nunca pisar na digitação.
- Guardas com `!= null` em vez de truthiness, para não perder `0`.
- `rpe` continua com `DEFAULT_RPE = "8"` — não é derivado do histórico.

---

## Parte 4 — UI

### Chip de veredito — `ActiveExerciseCard.tsx`, bloco do header (linhas 83-87)
A linha já é uma faixa horizontal de chips (`<span>Padrão</span>` + `<MuscleBadge>`), e `"Padrão"` é uma string placeholder estática — é o slot natural. **Custo vertical: zero.**

Novo componente `components/active-workout/components/ProgressionChip.tsx`, seguindo o padrão da classe `.badge-pr` do `index.css:400-410` (`inline-flex; padding 2px 8px; radius-sm; 11px/500`):

| Veredito | Cor | Texto |
|---|---|---|
| `INCREASE` | `bg-success-subtle text-success-subtle-fg` | "Subir · 42,5 kg" |
| `HOLD` | `bg-muted text-muted-foreground` | "Manter · 11 reps" |
| `REPEAT` | `bg-muted text-muted-foreground` | "Repetir · 40 kg" |
| `DELOAD` | `bg-destructive/10 text-destructive` | "Recuar · 36 kg" |
| `NO_HISTORY` | `bg-muted text-muted-foreground` | "Sem histórico" |

Sem token novo. O `index.css` não tem `--warning`, e o único âmbar é `--pr`, que significa "conquista" — overloadá-lo seria desvio semântico contra a filosofia declarada do arquivo. Vermelho para `DELOAD` é semanticamente correto (sinal de parar) e usa um par já validado em contraste.

### Razão legível — linha dos progress dots (linhas 107-121)
`advice.reason` entra na mesma linha dos dots, com `ml-auto text-[11px] text-muted-foreground truncate`. **Custo vertical: zero** — a linha dos dots tem 8px de conteúdo e sobra largura.

Restrição que justifica essa escolha: o card é o `[data-keyboard-anchor]` (linha 73), e `useKeepFocusedFieldVisible.ts:43` só rola o card inteiro para a viewport se `anchorRect.height <= visualViewport.height - 32`. Com teclado aberto num 390×844 o card já mede ~350px (~415px com a linha de barra aberta) contra ~400-450px de viewport útil. Qualquer banner de altura própria consome a folga e derruba o hook para o fallback que empurra RPE e o botão Confirmar para fora da tela.

### Alvo fantasma — `PendingSetRow.tsx`
Passar `weight={advice.suggestedWeight}` e `reps={advice.suggestedReps}` às linhas pendentes (o componente já aceita `weight`/`reps` e renderiza `—` quando ausente — hoje o peso não é passado). Zero mudança estrutural.

### Aviso de desvio — `ActiveExerciseCard.tsx`, abaixo do input de carga
Quando `advice.suggestedWeight != null` e o peso digitado excede a prescrição (`> suggestedWeight + increment/2`) e `verdict !== "INCREASE"`, substituir a legenda "kg" (linha ~145, `text-[12px]`) por `"acima do prescrito · {suggestedWeight} kg"` em `text-destructive`. Substitui em vez de somar — custo vertical zero — e o set é gravado normalmente.

### Marca do desvio no set concluído — `CompletedSetRow.tsx`
Prop opcional `deviation?: "up" | "down"`; quando presente, um `↑`/`↓` antes das métricas na faixa `ml-auto` existente. A comparação é feita no card, que tem o `advice`; a linha só renderiza. Isso cumpre "registrar o desvio" sem tocar no banco — `SessionSetPayload` não ganha campo e `userObservation` (nota do usuário) não é poluída.

---

## Arquivos

**Novos**
- `apps/web/src/features/workouts/utils/progression.ts`
- `apps/web/src/features/workouts/hooks/useExerciseHistory.ts`
- `apps/web/src/features/workouts/components/active-workout/components/ProgressionChip.tsx`

**Modificados**
- `apps/api/src/modules/workout-session/workout-session.{service,controller,routes}.ts`
- `apps/web/src/features/workouts/services/workout-session/workout-session.service.ts`
- `apps/web/src/features/workouts/hooks/{useActiveWorkoutLogic,useActiveExerciseCardLogic,useActiveSetInput}.ts`
- `apps/web/src/features/workouts/components/active-workout/exercise-stack/records/{ActiveExerciseCard,PendingSetRow,CompletedSetRow}.tsx`
- `apps/web/src/features/workouts/workout.types.ts` — tipos `ExerciseExecution` / `ExerciseHistoryMap`

**Removidos (se sem outro consumidor)**
- `apps/web/src/features/workouts/hooks/useExerciseSuggestions.ts`

---

## Verificação

1. **Função de veredito, isoladamente.** Antes de ligar na UI, exercitar `getProgressionAdvice` com históricos sintéticos cobrindo as cinco regras — inclusive o caso de `stalledSessions` e o de `maxRpe <= 8` com `minReps` exatamente no topo da faixa. Rodar via `npx tsx` num arquivo de scratch; não há runner de teste no projeto.
2. **Endpoint.** Com o dev server de pé, `GET /api/sessions/workout/<id>/exercise-history` autenticado; conferir que os sets vêm ordenados por `setNumber` e que cada lista de execuções vem do mais recente para o mais antigo.
3. **No app, com Chrome DevTools MCP em viewport mobile real** — `emulate` com `viewport: "390x844x3,mobile,touch"` (`resize_page` não desce abaixo de ~500px). Iniciar uma sessão de um treino com histórico e confirmar: o input de carga já nasce com a prescrição (nada de campo vazio ou piscada), o chip mostra o veredito certo, a razão aparece na linha dos dots.
4. **A corrida do prefill.** Com `Fast 3G` no `emulate`, recarregar e observar se o campo é semeado quando o histórico chega tarde. Reaplicar o viewport depois de qualquer `emulate` — um `emulate` só para mudar rede reseta o override de viewport.
5. **Regressão de teclado.** Com o teclado aberto e a linha "Adicionar Barra" visível (pior caso de altura), verificar que o botão Confirmar e os chips de RPE continuam na viewport — medir a altura do `[data-keyboard-anchor]` contra `visualViewport.height` e checar que `groupFits` ainda é verdadeiro. Testar no **quarto** exercício da lista, não no primeiro: a falha aparece quando a rolagem já está no meio do documento.
6. **Ciclo completo.** Finalizar a sessão e conferir que `["exercise-history"]` foi invalidada e que a próxima sessão do mesmo treino já prescreve com base na que acabou de ser gravada.
7. **Caso do `0` kg.** Registrar um set a 0 kg (peso corporal) e confirmar que a próxima sessão prescreve 0 e não campo vazio — é o bug de truthiness que existe em três pontos hoje.
8. `npm run build` na raiz, com o dev server **parado** — `tsc -b` estoura memória ("Zone Allocation failed") se ele estiver rodando; isso não é erro de tipo.

## Fora de escopo, registrado

Encontrado durante a exploração, não tocar nesta passada:
- `session-set.service.ts:6-23` (`create`) **não verifica `userId`** — o controller nunca chama `getUserId`, então qualquer usuário autenticado pode adicionar sets a qualquer sessão. Falha de autorização real, mas o fluxo de treino ativo não usa esse endpoint (persistência é toda no finish).
- `workout.service.ts:41-46` (`getById`) também não tem checagem de posse.
- `SessionRecoveryDialog.tsx:46` lê `session?.workout?.name`, mas `findActiveSession` usa `SESSION_INCLUDE`, que não traz `workout` — o diálogo sempre cai no fallback `"Treino"`.
- `active-workout.store.ts` persiste `lastSession` no localStorage e **nada nunca lê** esse campo. Vira código morto com esta mudança.
