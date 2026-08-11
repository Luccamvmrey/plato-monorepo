# Design — Flexibilidade em sessão (A) e encadeamento de treinos (B)

> Documento de decisões. **Nenhum código de produção foi escrito.** Nenhum `UPDATE`/`DELETE`
> foi executado — todas as consultas ao banco de produção foram somente leitura.
> Data: 2026-08-10. Base: `develop` @ `af117fa`.

---

## 0. Sumário e recomendação

| | Recomendação |
|---|---|
| **Parte B (Program)** | **Fazer primeiro.** É aditivo, não migra dado nenhum, e a regra de "próximo treino" derivada acerta **10 de 11** transições do histórico recente do usuário. Menor risco e maior retorno dos dois. |
| **Parte A (snapshot)** | **Fazer em dois passos.** Passo 1a (materializar o plano da sessão, só escrita) para de destruir o histórico **hoje** e custa pouco. Passo 1b (UI de troca/adição/skip lendo o snapshot) fica para depois do builder. |
| **`MovementPattern`/`Equipment`** | Fazer junto com A-1b. Sozinhos não entregam nada; alimentam a sugestão de substituto **e** a detecção de redundância do builder. |
| **Fora de escopo agora** | Deload, métrica de aderência à rotação, catálogo por usuário. |

A premissa mais importante do handoff — *"editar um treino reescreve retroativamente o que
sessões antigas parecem ter prescrito"* — **está confirmada e é mensurável**: 33 das 82 sessões
do banco (40%) hoje aparentam ter pulado exercício, e não existe consulta capaz de separar
"pulou" de "o treino foi editado depois". Isso não é risco futuro; é dano já acumulado.

---

## 1. Verificação de premissas contra o código

| # | Premissa do handoff | Veredito | Evidência |
|---|---|---|---|
| 1 | `SessionSet` referencia `exerciseId`, não `workoutExerciseId` | ✅ Confirmado | `schema.prisma:131-146`. O modelo também tem `excludedFromRecords`, que o handoff não menciona e que qualquer proposta nova precisa preservar |
| 2 | `POST /api/sessions/sets` aceita `workoutSessionId` + `exerciseId` sem validar contra o plano | ✅ Confirmado — **e é pior** | `session-set.service.ts:6-22` valida existência da sessão e `completedAt`, e **não valida posse**. Ver §1.1 |
| 3 | "O backend já permite registrar qualquer exercício em qualquer sessão" | ✅ Confirmado | Vale também para o caminho realmente usado (`finishSession`), que faz `createMany` sem checar o plano (`workout-session.service.ts:135-156`) |
| 4 | "Adicionar exercício em sessão é hoje um problema de UI, não de dados" | ✅ Confirmado, com precisão a mais | `useExerciseStack.ts:37` deriva a pilha **inteira** de `workout.workoutExercise`. Um exercício fora do plano não renderiza na tela de Sessão — mas *aparece* no Histórico e no Resumo, que leem `session.sessionSet` direto. Ou seja: hoje ele seria invisível exatamente onde importa |
| 5 | "Não existe representação do plano da sessão" | ⚠️ Parcialmente falso | Existe, **efêmera e não persistida**: a store Zustand já carrega `sessionExerciseOrder`, `exerciseExtraSets` e `exerciseNotes` (`active-workout.store.ts:5-10`). Ou seja, o app já aceita "desvio em sessão" — e já **descarta** três tipos de desvio ao finalizar |
| 6 | Editar treino reescreve a história das sessões | ✅ Confirmado e quantificado | `workout.service.update` é `deleteMany` + `createMany` (`workout.service.ts:74-85`). Medido: **46 pares (sessão, exercício prescrito sem nenhuma série)** em **33 das 82 sessões**; e **9 séries em 3 sessões** apontam para exercício que **não está** no plano do treino |
| 7 | "41 sessões e ~500 séries existentes" | ⚠️ Parcial | 41 sessões ✅ (usuário 1), mas **654 séries**. E a migration é sobre o banco inteiro: **82 sessões, 1112 séries, 18 usuários, 6 deles com histórico** |
| 8 | "88 exercícios" no catálogo | ❌ Falso | **117 exercícios, 105 não depreciados.** O trabalho manual de classificação é ~20% maior que o estimado |
| 9 | `GET /api/users/streak` já existe | ✅ Confirmado | `user.routes.ts:16` |
| 10 | Catálogo não tem padrão de movimento nem equipamento | ✅ Confirmado | `Exercise` tem `targetMuscle`, `secondaryMuscles`, `loadType`, `repUnit`, `deprecated`. Nada sobre padrão ou equipamento |
| 11 | Redundância no Treino B (dois verticais + dois horizontais) | ✅ Confirmado no dado real | Workout 31 "Treino B - Exp": `Remada Curvada com Barra` + `Remada Unilateral com Halter` (ambos horizontal pull) e `Puxada Vertical (Padrão)` + `Puxada Frontal na Polia` (ambos vertical pull) |
| 12 | "Trabalho de schema pendente em outro handoff (`LoadType`, `BodyWeightLog`, `ADDUCTORS`, PR, depreciação)" | ❌ Desatualizado | **Tudo já aplicado.** Cinco migrations sobre o baseline `0_init`. Não há migration pendente em `Exercise` para pegar carona — `MovementPattern`/`Equipment` serão uma migration própria |
| 13 | "Impacto no app mobile" | ❌ Não existe | `apps/` tem só `api` e `web`. O "mobile" é o mesmo app React, mobile-first. Não há segunda superfície para impactar |
| 14 | Cadência de 2,4 sessões/semana, 3,4 no último bloco, hiato de 3 semanas em maio | ✅ Confirmado | Usuário 1: 41 sessões concluídas entre 28/04 e 06/08 (~14,4 semanas) = **2,8/semana**; último bloco (13/07–06/08) = **3,4/semana**; um único intervalo de **22 dias** em maio |

### 1.1 Achado lateral, fora do escopo deste documento: `POST /api/sessions/sets` não valida posse

```ts
// session-set.service.ts
const create = async (payload: any) => {
    const workoutSession = await prisma.workoutSession.findUnique({
        where: { id: payload.workoutSessionId },   // ← sem userId
    });
    ...
```

O controller sequer chama `getUserId(req)`. Qualquer usuário autenticado pode gravar séries
na sessão aberta de outro usuário — e isso contamina PR e progressão da vítima. É a mesma
família de falha de posse corrigida em `af117fa`/`b9c6ea5` para `users` e `workouts`, que
passou batida aqui.

Agravante e atenuante ao mesmo tempo: **o cliente web não usa esse endpoint.** A única
chamada em `apps/web` é `PUT /sessions/sets/:id` (que valida posse via `ensureOwnership`). O
caminho real de escrita é `POST /sessions/:id/finish` com o lote acumulado em `pendingSets`.
Ou seja, o endpoint está órfão.

**Recomendação:** corrigir ou remover antes de qualquer coisa deste documento. É meia hora
de trabalho e independe das duas features.

### 1.2 Consequência do item 6 que muda a leitura do problema

O cliente atual **não consegue** submeter uma série fora do plano: a pilha de exercícios é
derivada de `workout.workoutExercise` e cada `pendingSet` nasce de um card dessa pilha.
Portanto as 9 séries órfãs no banco **não são** evidência de uso ad-hoc — são resíduo de
edição de plano posterior à sessão (ou do endpoint órfão de §1.1, usado por algum cliente
antigo).

Isso inverte a leitura: não há demanda histórica observável por "adicionar exercício"; há
dano observável causado por editar treino. **A Parte A tem duas metades com urgências
diferentes** — o snapshot é urgente, a flexibilidade de UI é desejável.

---

## 2. Parte A — proposta de schema

### 2.1 Alternativa 1 (a do handoff, corrigida): `SessionExercise` **aditivo e nulável**

```prisma
model SessionExercise {
  id               Int      @id @default(autoincrement())
  workoutSessionId Int
  exerciseId       Int
  orderIndex       Int
  targetSets       Int
  targetReps       Int
  observation      String?

  origin           SessionExerciseOrigin @default(PRESCRIBED)
  /// Aponta para o SessionExercise substituído (mesma sessão).
  substitutedForId Int?
  skipped          Boolean  @default(false)

  workoutSession   WorkoutSession   @relation(fields: [workoutSessionId], references: [id], onDelete: Cascade)
  exercise         Exercise         @relation(fields: [exerciseId], references: [id])
  substitutedFor   SessionExercise? @relation("Substitution", fields: [substitutedForId], references: [id])
  substitutedBy    SessionExercise[] @relation("Substitution")
  sessionSet       SessionSet[]

  @@unique([workoutSessionId, orderIndex])
  @@index([workoutSessionId])
}

enum SessionExerciseOrigin {
  PRESCRIBED
  SUBSTITUTED
  AD_HOC
}
```

**Divergência deliberada do handoff:** o handoff sugere que `SessionSet` "passaria a apontar
para `SessionExercise` (mantendo `exerciseId` denormalizado, ou não — avalie)". Avaliado:

> `SessionSet.exerciseId` continua **`NOT NULL` e canônico**.
> `SessionSet.sessionExerciseId` entra **`Int?`, nulável para sempre**.

Motivos, em ordem de peso:

1. **Elimina a migration de dados.** Com `sessionExerciseId` obrigatório, as 1112 séries
   existentes precisariam de linhas `SessionExercise` sintéticas — e `targetSets`/`targetReps`
   viriam do plano **atual**, que é exatamente a ficção que o handoff manda não inventar.
   Nulável = zero backfill, zero risco.
2. **Blast radius.** 39 arquivos referenciam `exerciseId` (API, web, `@plato/shared`, scripts
   de manutenção). Trocar a chave obrigaria a revisar todos. Mantendo o denormalizado,
   **nenhuma query existente muda** — `getExerciseHistoryByWorkout`, `scanForRecords`,
   `listByExerciseId`, `recompute-personal-records.ts`, `records.ts`/`session.ts` do shared
   seguem funcionando intactos.
3. **`null` já significa a coisa certa.** Sessão sem snapshot = legado. É o tratamento que o
   handoff pede, sem coluna extra e sem convenção nova.

**Custo desse desenho:** as duas colunas podem divergir (`SessionSet.exerciseId` ≠
`sessionExercise.exerciseId`). É denormalização de verdade e precisa de uma linha de
comentário no schema mais uma checagem no service de escrita. Aceito — o alternativo é migrar
1112 linhas com dado inventado.

**Sub-passo 1a — "parar de sangrar" (recomendado agora):**
materializar `SessionExercise` no `POST /api/sessions` a partir do `WorkoutExercise` vigente,
e preencher `sessionExerciseId` no `finishSession`. **Mais nada.** A UI continua lendo o plano
vivo, nenhuma tela muda, nenhum comportamento muda. A partir daí toda sessão nova tem
prescrição congelada e a pergunta "o que estava prescrito naquele dia?" passa a ter resposta.

**Sub-passo 1b — usar o snapshot:** a pilha da sessão passa a ler `SessionExercise`, e entram
troca, adição e skip. É aqui que mora quase todo o custo (§5).

### 2.2 Alternativa 2 (a barata do handoff): só colunas em `SessionSet`

```prisma
// em SessionSet
origin                    SessionSetOrigin @default(PRESCRIBED)
substitutedForExerciseId  Int?
```

| | Alternativa 1 | Alternativa 2 |
|---|---|---|
| Troca de exercício | ✅ | ✅ (com a origem por série, não por exercício) |
| Adição ad-hoc | ✅ | ✅ |
| **Skip** ("prescrito e não executado") | ✅ | ❌ — não há linha para o que não aconteceu |
| **Snapshot da prescrição** | ✅ | ❌ — o dano do item 6 continua |
| Ordem real da sessão | ✅ (`orderIndex`) | ❌ (hoje já se perde: `sessionExerciseOrder` morre na store) |
| Migration de dados | nenhuma | nenhuma |
| Custo total (§5) | 9–15 dias (1a: 1,5–2,5) | 4–6,5 dias |
| Resolve a causa do problema medido em §1 | **sim** | não |

### 2.3 Alternativa 3 (não estava no handoff): nada no banco, só UI

Estender o que a store **já faz**: `sessionExerciseOrder` e `exerciseExtraSets` já são desvios
efêmeros; acrescentar `adHocExercises: number[]` e `substitutions: Record<number, number>` e
renderizar a partir disso. As séries persistem normalmente (são `SessionSet`); o que se perde
é só a *intenção*.

Custo: 2–3 dias, quase tudo UI. Coerente com o precedente do próprio código. É a opção certa
**se** a resposta para "quero saber se substituí" for "não preciso saber".

Sua fraqueza é a mesma da 2: não toca no problema de §1.2, que é o problema com dano medido.

### 2.4 Recomendação da Parte A

**Alternativa 1, dividida:** fazer **1a agora** (barato, invisível, para o dano) e decidir
1b vs. Alternativa 3 depois, com o snapshot já rodando. Fazer a 2 seria pagar 4–6 dias por
uma estrutura que a 1 substitui inteira depois — é o único caminho que gasta duas vezes.

*(Conforme o handoff, a escolha final é sua. As três estão acima com o custo de cada uma.)*

### 2.5 Respostas às questões abertas da Parte A

| Questão | Recomendação |
|---|---|
| Trocar exercício depois de já ter registrado séries dele | Permitir. Vira um segundo `SessionExercise` com `origin = SUBSTITUTED` e `substitutedForId` apontando para o primeiro; o primeiro fica com suas séries e **não** é marcado `skipped`. Nada é apagado |
| A troca vale só para a sessão? | Só a sessão. Sugestão passiva de aplicar ao plano depois de 3 trocas iguais consecutivas — mas isso é uma feature à parte, fora do MVP |
| `exercise-history` para exercício `AD_HOC` | Hoje o histórico é **escopado ao treino** de propósito (`workout-session.service.ts:166-174`), então um ad-hoc volta vazio e o card fica sem prescrição. Precisa de fallback: buscar histórico **global** do exercício quando ele não pertence ao plano. É um `if` no service + uma segunda query, não um endpoint novo |
| PR de exercício ad-hoc conta? | Sim, sem exceção. `scanForRecords` lê `SessionSet` por `exerciseId` e não olha o plano — já funciona, e mudar isso criaria uma classe de série que treina o corpo mas não o histórico |

---

## 3. Parte B — proposta de schema

```prisma
model Program {
  id          Int      @id @default(autoincrement())
  userId      Int
  name        String
  description String?
  isActive    Boolean  @default(false)
  createdAt   DateTime @default(now())

  user            User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  programWorkout  ProgramWorkout[]
  workoutSession  WorkoutSession[]

  @@index([userId])
}

model ProgramWorkout {
  id         Int @id @default(autoincrement())
  programId  Int
  workoutId  Int
  orderIndex Int

  program Program @relation(fields: [programId], references: [id], onDelete: Cascade)
  /// Restrict, NÃO Cascade: tirar um treino do programa não pode encostar em sessão nenhuma.
  workout Workout @relation(fields: [workoutId], references: [id], onDelete: Restrict)

  @@unique([programId, orderIndex])
  @@unique([programId, workoutId])
}

// em WorkoutSession
programId Int?
program   Program? @relation(fields: [programId], references: [id], onDelete: SetNull)
```

Duas notas de implementação que o handoff não cobre:

- **`isActive` único por usuário não é expressável no `schema.prisma`.** Prisma não tem índice
  único parcial. Precisa de SQL escrito à mão dentro da migration:
  `CREATE UNIQUE INDEX "program_one_active_per_user" ON "Program" ("userId") WHERE "isActive";`
  mais um `$transaction` no service que desativa o anterior antes de ativar o novo. Sem o
  índice, uma corrida deixa dois ativos e `/active/next` vira não-determinístico.
- **Ordem de rota.** `GET /api/programs/next` colidiria com `/:id` — mesma pegadinha já
  documentada em `user.routes.ts:20-22`. Usar `/api/programs/active/next` (dois segmentos,
  sem colisão) ou registrar o literal antes.

### 3.1 "Próximo treino" como função — validado contra o histórico real

Regra: *o sucessor, na ordem do programa, do treino do programa mais recentemente **concluído***.

Apliquei a regra retroativamente às 41 sessões concluídas do usuário 1, tratando os dois
conjuntos de treinos como dois programas (v1 = Treinos A–E, ids 11/15/16/18/23; v2 = "- Exp",
ids 30–34):

| Era | Transições | Acertos da sugestão | % |
|---|---|---|---|
| v1 (abr–jul) | 26 | 12 | **46%** |
| v2 (13/07–06/08) | 11 | 10 | **91%** |

O único desvio da era v2 foi em 03/08: depois do Treino D, a regra sugeriria E e o usuário fez
A. **Na sessão seguinte a regra já estava certa de novo** (sugeriu B, ele fez B) — que é
exatamente a propriedade de auto-recuperação que justifica derivar em vez de guardar ponteiro.

Os 46% da era v1 não são contra-argumento: junho foi um bloco desorganizado, e é justamente o
comportamento que o programa existe para organizar. O que os dois números juntos dizem é:
**a sugestão nunca pode bloquear**, porque metade do tempo, num bloco ruim, ela erra.

### 3.2 Efeito colateral da regra: o último treino passa fome

Sob sucessor estrito, o Treino E só é sugerido logo depois de D. Um único desvio empurra E um
ciclo inteiro para frente — e é o que se vê no dado: na era v2, E foi feito **1 vez** contra 3
de A, B e C. Não é bug da regra, é consequência dela.

Mitigação recomendada (sem estado novo): a lista de Treinos mostra "há N dias" para cada
treino do programa. Isso torna a fome visível sem inventar fila de prioridade.

### 3.3 Casos-limite

| Caso | Decisão recomendada | Justificativa |
|---|---|---|
| Pular um treino | Continua na rotação; o ponteiro recalcula a partir do que foi feito | Dado real de 03/08: a regra se recuperou sozinha na sessão seguinte |
| Mesmo treino 2× seguidas | O ponteiro avança normalmente (sucessor do último feito) | A regra já lê "último concluído"; repetição não trava nada |
| Sessão fora de qualquer programa | **Ignorar** no cálculo, não resetar | Precedente real: "Temp - Braços" (workout 25) foi intercalado 2× na rotação do usuário 1 |
| Sessão aberta/abandonada | Não conta. Só `completedAt != null` move o ponteiro | Existe hoje 1 sessão aberta desde 08/07 com 0 séries (usuário 5). Contá-la congelaria o ponteiro por um mês |
| Workout removido do programa no meio do ciclo | O ponteiro usa a sessão mais recente **cujo treino ainda está no programa**; se nenhuma, `orderIndex` 1 | Determinístico, e não exige tocar em sessão histórica |
| Mais de um programa ativo | **Não permitir.** Índice único parcial + transação no `activate` | Sem isso, `/active/next` não é determinístico |
| Workout em dois programas | **Permitir** (sem unique em `workoutId`) | `WorkoutSession.programId` desambigua na leitura; e o custo de proibir é alto para o usuário que reaproveita um treino |
| Versionar/aposentar programa | Programa é **arquivado** (`isActive = false`), nunca apagado; sessões antigas mantêm `programId` | É o que o usuário já faz na mão: em 13/07 ele recriou os 5 treinos como "- Exp" e arquivou os antigos (`isActive = false`) |
| Deload | Fora de escopo. Representável como programa separado quando vier | Concordo com o handoff |
| Aderência à rotação como métrica | Fora do MVP | Os números de §3.1 mostram que ela oscila 46%→91% medindo mais a troca de versão do programa do que a disciplina do usuário |

### 3.4 Endpoints

| Método | Rota | Nota |
|---|---|---|
| `GET` | `/api/programs` | Lista com `programWorkout.workout` incluído |
| `POST` | `/api/programs` | Cria programa + ordem numa transação |
| `PUT` | `/api/programs/:id` | Substituição completa da lista de workouts (mesmo padrão de `workout.service.update`) |
| `DELETE` | `/api/programs/:id` | Sessões mantêm o histórico via `SetNull` |
| `PATCH` | `/api/programs/:id/activate` | Transação: desativa o ativo, ativa este |
| `GET` | `/api/programs/active/next` | `{ workout, positionInCycle, totalInCycle, lastCompletedAt }` — derivado, sem estado |

`POST /api/sessions` ganha `programId` opcional; se omitido e houver programa ativo contendo
o treino, o service preenche sozinho.

---

## 4. Migração e backfill

**Ordem, por migration:**

1. `add_program` — `Program`, `ProgramWorkout`, `WorkoutSession.programId` (nulável) + o índice
   único parcial em SQL manual. **Aditiva pura.**
2. `add_session_exercise` — `SessionExercise`, enum, `SessionSet.sessionExerciseId` (nulável).
   **Aditiva pura.**
3. `add_exercise_movement_pattern` — dois enums + duas colunas nuláveis em `Exercise`.
   **Aditiva pura.**

Nenhuma das três reescreve linha existente. Nenhuma precisa de janela de manutenção.

**O que explicitamente NÃO será backfillado:**

| Dado | Decisão | Motivo |
|---|---|---|
| `SessionExercise` das 82 sessões existentes | **Não criar** | Reconstruir do `WorkoutExercise` atual seria inventar prescrição; 33 dessas sessões já divergem do plano vigente |
| `SessionSet.sessionExerciseId` das 1112 séries | **Fica `null`** | `null` = "histórico legado". A UI mostra a sessão do jeito que já mostra hoje |
| `WorkoutSession.programId` das sessões passadas | **Fica `null`** | Não havia programa. Consequência aceita: o primeiro cálculo de "próximo" após ativar um programa cai no `orderIndex` 1 |
| `Exercise.movementPattern` / `equipment` | **Preencher**, mas por revisão humana | Ver §5. Heurística por nome já provou errar neste catálogo (`Do-Not-Repeat`, 2026-08-10) |

**Procedimento obrigatório antes de cada migration** (restrições do handoff + `cerebrum.md`):
`pg_dump --schema=public` pela porta **5432** (`DIRECT_URL`) — o pooler de transação na 6543
não serve — usando `C:\Program Files\PostgreSQL\17\bin\pg_dump.exe`. E `prisma migrate`, não
`db push`: o baseline `0_init` existe desde 10/08 e `DATABASE_URL` local aponta para produção.

---

## 5. Impacto nas telas

| Tela / arquivo | Parte B | Parte A-1a | Parte A-1b |
|---|---|---|---|
| `WorkoutListPage` + `WorkoutList` | Agrupar por programa, badge "Próximo", "há N dias". Hoje o único destaque é `lastCompletedWorkoutId` | — | — |
| Treinos fora de qualquer programa | Precisam de seção própria ("Avulsos"). O filtro atual é só `isActive` (Ativos/Arquivados), então vira uma segunda dimensão | — | — |
| Editor de programa | **Tela nova** (ordenar treinos, ativar) | — | — |
| `ActiveWorkoutPage` / `useExerciseStack` | Nada | Nada (por desenho) | **Reescrita da fonte da pilha**: hoje deriva de `workout.workoutExercise` com status `COMPLETED/ACTIVE/PENDING`; passa a derivar de `SessionExercise`, com caminho duplo para sessão legada (`null`) |
| `ActiveExerciseCard` (295 linhas) | Nada | Nada | Ações de trocar/pular por card; a cadeia de prescrição (`buildAdviceChain`) precisa lidar com exercício sem histórico no treino |
| `NewExerciseSheet` | Nada | Nada | Reaproveitável, mas **acoplada**: `useNewExerciseSheet:6` chama `addExercises` da store do **editor**. Precisa receber `onConfirm` por prop |
| `HistoryPage` / `WorkoutSummaryPage` | Filtro por programa (opcional) | Nada | Badges de origem/skip, com fallback para sessões legadas |
| `ExerciseAnalyticsPage` | Nada | Nada | Nada — lê por `exerciseId`, que continua canônico |
| App mobile | **Não existe** (§1, item 13) | | |

---

## 6. Estimativas

Faixas em **dias de trabalho focado**, um desenvolvedor já familiarizado com o repositório.
Incerteza declarada por linha. As faixas de UI são as menos confiáveis — a tela de Sessão
concentra a lógica mais delicada do app (cadeia de prescrição, teclado, foco).

### Parte B — Program

| Item | Faixa | Incerteza |
|---|---|---|
| Schema + migration + índice parcial manual | 0,5–1 | Baixa |
| Endpoints (CRUD, activate, active/next) + Zod + posse | 1–2 | Baixa |
| UI: lista agrupada + badge de próximo | 1–2 | Média |
| UI: editor de programa (ordenação) | 1–2 | Média |
| **Total** | **3,5–7** | |

### Parte A

| Item | Faixa | Incerteza |
|---|---|---|
| **1a** — schema + materializar no create + linkar no finish | **1,5–2,5** | Baixa |
| 1b — endpoints (troca, skip, ad-hoc, fallback de histórico global) | 2–3,5 | Média |
| 1b — UI da pilha lendo `SessionExercise` + caminho legado | 3–5 | **Alta** |
| 1b — sheet de troca/adição + reaproveitamento do picker | 1,5–2,5 | Média |
| 1b — badges em Histórico/Resumo | 1–2 | Média |
| **Total 1a + 1b** | **9–15,5** | |
| *(Alternativa 2, se escolhida no lugar)* | *4–6,5* | Média |
| *(Alternativa 3, se escolhida no lugar)* | *2–3* | Média |

### `MovementPattern` / `Equipment`

| Item | Faixa | Incerteza |
|---|---|---|
| Schema + migration | 0,5 | Baixa |
| **Classificação manual de 105 exercícios ativos** | **0,5–1** | Média |
| Endpoint de sugestão + ranking | 1–1,5 | Média |
| UI da sugestão (com o motivo, não só a lista) | 1–2 | Média |
| **Total** | **3–5** | |

Sobre a classificação: o padrão de `classify-catalog.ts` (dry-run por default, aplica só com
`APPLY=1`) deve ser reusado. O script **propõe**, a revisão é humana e obrigatória — 105 itens
a ~10 s/item de revisão dão ~20 min de leitura pura, mas os casos ambíguos (unilateral,
máquina que imita livre, variações "(Padrão)") comem o resto. Heurística por nome já falhou
neste catálogo e não deve ser aceita sem revisão.

---

## 7. Ordem recomendada e corte

```
0. Corrigir/remover POST /api/sessions/sets (posse)      ~0,5 dia   [independente, fazer já]
1. Parte B — Program completo                            3,5–7      [MVP]
2. Parte A-1a — snapshot só de escrita                   1,5–2,5    [MVP]
   ────────────────────────────── corte do MVP ──────────────────────────────
3. MovementPattern + Equipment + classificação           3–5
4. Parte A-1b — UI de troca / adição / skip              7,5–13
5. Sugestão passiva "aplicar troca ao plano"             fora
6. Deload, aderência à rotação, catálogo por usuário     fora
```

**Por que a Parte B vem antes da A:** é aditiva, não migra dado, tem validação empírica
(91% de acerto no bloco recente) e destrava a decisão de agrupamento que o builder também
precisa. A Parte A-1b, ao contrário, é a mudança de maior alcance dos dois handoffs e mexe na
tela mais delicada do app.

**Por que 1a entra no MVP mesmo sem entregar nada visível:** cada semana sem ele é mais
histórico que vira ficção quando um treino é editado — e o builder existe justamente para
tornar edição de treino barata e frequente. Fazer 1a **antes** do builder é a diferença entre
congelar o dano onde ele está e multiplicá-lo.

**O que este documento decide para o builder** (conforme §"Sobreposição" do handoff):

- `Program` / `ProgramWorkout` / `WorkoutSession.programId` são **destes** aqui. O builder consome.
- O snapshot de prescrição é **desta** decisão: `SessionExercise` aditivo com
  `SessionSet.sessionExerciseId` nulável e `exerciseId` preservado. O builder **não** precisa
  de versionamento de `Workout` — o snapshot resolve o risco que o `builder.md` levanta no
  Passo 2.
- `MovementPattern` / `Equipment` ficam nesta trilha (fase 3) e alimentam a detecção de
  redundância do builder — cuja premissa, aliás, foi confirmada no dado real (§1, item 11).
