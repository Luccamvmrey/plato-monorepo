# Estudo de viabilidade — Builder web-desktop

> Documento de decisões. **Nenhum código de produção foi escrito.** Todas as consultas ao
> banco de produção foram `SELECT` — nenhum `INSERT`/`UPDATE`/`DELETE`/DDL, nenhum
> `db push`, nenhum seed.
> Data: 2026-08-11. Base: `develop` @ `85ffa9c`.
> Responde ao handoff `builder.md` (raiz, não versionado).

> **Addendum de 2026-08-11, depois da leitura do usuário.** Três decisões mudaram o
> que este documento propõe:
> - **Duplicação de treino: cortada.** A evidência de §3.3 é circunstancial — inferi de
>   `Treino A…E` coexistirem com `Treino A…E - Exp` que ele os recriou à mão. Nome de
>   treino não é prova de fluxo de trabalho.
> - **Volume planejado e agrupamento: implementados**, nesta ordem, e não adiados.
> - **`ALTERNATING` não existe.** A proposta de §3.2 tinha três tipos de grupo; na
>   prática `ALTERNATING` e `SUPERSET` executam igual (revezam série a série), então
>   sobraram dois. O agrupamento também **mudou a mecânica da sessão**, que §3.2 dava
>   como o pedaço caro a evitar: o rodízio dentro do grupo é derivado de quem tem menos
>   séries feitas, o que coube em função pura sem reescrever `useExerciseStack`.
>
> A recomendação de §9 — **adiar o builder** — segue de pé, e agora com mais força: os
> dois itens que entregavam a maior parte do ganho foram entregues sem tela nova.

---

## 0. Sumário e recomendação

| | Recomendação |
|---|---|
| **Builder web-desktop** | **Adiar.** Não é o gargalo. Os três itens que entregam quase todo o ganho não precisam de tela nova, e o pré-requisito técnico do builder de verdade (ids estáveis em `WorkoutExercise`) ainda não foi decidido. |
| **Duplicação de treino** | **Fazer já.** `POST /api/workouts/:id/duplicate`, sem migration. Melhor razão valor/custo do estudo, e a evidência de que falta é forte (§1, premissa 9). |
| **Volume semanal por grupo muscular** | **Fazer já, no editor mobile atual.** É o recurso de maior valor do handoff — e medindo, ele não depende de tela grande. |
| **Agrupamento (bi-set / tri-set / rest-pause)** | **Fazer depois**, com colunas nuláveis em `WorkoutExercise` + espelho em `SessionExercise`. Única lacuna de prescrição com evidência no dado. Não bloqueia o MVP de nada. |
| **Faixa de reps / RPE / descanso** | **Não fazer.** A faixa derivada `[targetReps, targetReps+2]` já cobre o uso observado, incluindo o único caso escrito em texto livre. Ver §3.1. |
| **Fora de escopo** | Prescrição por série (top set + back-off), entrypoint separado, subdomínio, cookie httpOnly. |

**A frase que resume o estudo:** o handoff parte de que montar treino é o problema, e a
medição diz que montar não é onde o usuário perde. O plano que ele montou está
razoável; o que falha é **cumprir a rotação** — e a ferramenta para isso (`Program` +
`GET /programs/active/next`) foi entregue há um dia e ainda não foi adotada (§1, premissa 8).

---

## 1. Verificação de premissas contra o código e o banco

O `builder.md` foi salvo em **10/08 20:17**. Entre **22:09 e 00:55** entraram sete commits
(`02e287c` → `85ffa9c`) que fecham a maior parte do que ele lista como lacuna. O briefing não
está errado por descuido — ele foi escrito antes.

| # | Premissa do handoff | Veredito | Evidência |
|---|---|---|---|
| 1 | "Não existe o conceito de programa" (`:37`) | ❌ **Existe** | `Program` + `ProgramWorkout(programId, workoutId, orderIndex)` (`schema.prisma:110-141`); módulo API completo (`program.routes.ts:14-22`); `ProgramEditorPage` + `ProgramCycleEditor` no web |
| 2 | "Não há versionamento — editar reescreve a história" (`:49`) | ❌ **Resolvido** | `SessionExercise` (`schema.prisma:222-248`) copia a prescrição por valor no início da sessão (`workout-session.service.ts:70-99`). O doc anterior já concluiu que `Workout` **não** precisa de versionamento (`design-flexibilidade…:430-432`) |
| 3 | "Detecção de redundância" como coisa a construir (`:75`) | ❌ **Já existe** | `findRedundantGroups` (`features/workouts/utils/movement.ts:64-89`) + `RedundancyNotice.tsx`, rodando no editor **mobile** de hoje |
| 4 | Migrations pendentes: `LoadType`, `BodyWeightLog`, `ADDUCTORS`, PR, depreciação (`:31`) | ❌ **Aplicadas** | 9 migrations sobre `0_init`. Ver ressalva na premissa 10 |
| 5 | "88 exercícios" no catálogo (`:27`) | ❌ **117** | 117 total, 12 depreciados, **105 ativos**. Medido |
| 6 | "ajustes no app mobile existente" como frente de trabalho (`:88`) | ❌ **Não existe** | `apps/` só tem `api` e `web`. O "mobile" é o mesmo app React, mobile-first |
| 7 | "montar um plano de 6 treinos com 14 exercícios cada" (`:5`) | ❌ **Superestimado 2,4×** | Os 5 treinos ativos do usuário 1 têm 6, 8, 5, 10 e 6 exercícios — **35 no total**, média 7. Nenhum treino do banco inteiro passa de 10. O handoff projeta 84 linhas; a realidade é 35 |
| 8 | (implícita) o usuário adotou `Program` | ⚠️ **Não** | Existe **1** programa no banco inteiro, do **usuário 7** (treinos chamados "Teste", "Teste Teste"). O usuário 1 não tem programa. **3 de 29 treinos** pertencem a algum programa |
| 9 | "Montar Push B a partir de Push A é o caso de uso número um" (`:47`) | ✅ **Confirmado, com evidência** | O usuário 1 tem duas gerações completas: `Treino A…E` (inativos, 16/06→11/07) e `Treino A…E - Exp` (ativos, 13/07→06/08). Ele recriou os cinco à mão |
| 10 | "se as duplicatas genéricas ainda existirem, a busca vai expor a bagunça" (`:31`) | ✅ **Parcialmente. 10 ainda visíveis** | 22 exercícios `(Padrão)`, 12 depreciados, **10 ainda no picker** — e todos com histórico (`Supino Inclinado (Padrão)`: 45 séries em 3 planos). Foram mantidos por decisão sua (`classify-catalog.ts:38-42`) |
| 11 | `PUT /api/workouts/:id` substitui a lista inteira (`:25`) | ✅ **Confirmado** | `deleteMany` + `createMany` dentro de `$transaction` (`workout.service.ts:70-85`). Sem diff, sem upsert; `updateWorkoutExerciseSchema` nem aceita `id` |
| 12 | "o cliente manda os índices" (`:26`) | ✅ **Confirmado, sem normalização** | `workout.service.ts:14-20` repassa `orderIndex` verbatim, e `WorkoutExercise` **não tem** `@@unique([workoutId, orderIndex])` — ao contrário de `ProgramWorkout` (`:138`) e `SessionExercise` (`:245`), onde o servidor deriva da posição |
| 13 | `GET /api/exercises` é público e devolve o catálogo inteiro (`:27`) | ✅ **Confirmado** | `exercise.routes.ts:9` sem `authenticate`; `exercise.service.ts:14-17` sem paginação, sem busca, filtrando só `deprecated: false` |
| 14 | "Auth: JWT Bearer. Onde o token é guardado?" (`:28`) | ✅ **localStorage** | `auth.store.ts:33-34`, chave `plato-auth-storage`, sem `partialize`. Anexado em `core/api/index.ts:17-23`. **Ver §1.1 — o token não expira** |
| 15 | Bi-set/tri-set/rest-pause vivem na `description` (`:45`) | ✅ **Confirmado, e são os exemplos literais dele** | 3 dos 5 treinos ativos do usuário 1. Ver §1.2 |
| 16 | "~0,7 exposições por grupo por semana" (`:74`) | ✅ **Confirmado para a metade inferior do corpo** | Ver §1.3 — mas a causa não é a que o handoff supõe |

### 1.1 Achados fora do escopo do handoff

Quatro coisas que o briefing não pede e que apareceram na leitura. **Nenhuma foi corrigida** —
este documento não escreve código de produção.

1. **O JWT não tem expiração.** `auth.utils.ts:18` — `sign(payload, JWT_SECRET)`, sem
   `expiresIn`, sem `exp`, sem refresh, sem revogação. Um token vazado vale para sempre.
   Guardado em localStorage sem `partialize`, junto do objeto de usuário.
   *Não deve entrar no escopo do builder* — é problema próprio e maior.

2. **`WorkoutExercise.observation` é inalcançável pela UI.** O Zod aceita `observations`, o
   service mapeia para a coluna (`workout.service.ts:12-20`), mas `loadWorkout` não lê e o
   payload de save não envia (`useWorkoutEditorLogic.ts:113-122`). Medido: **0 de 148 linhas**
   têm `observation` preenchida. A coluna existe, custou uma migration, e nunca recebeu dado.
   Relevante para o builder porque "observação por exercício" seria feature nova — e o
   back-end já a suporta inteiro.

3. **`WORKOUT_INCLUDE` não tem `orderBy`** (`workout.service.ts:6-10`). O `GET` devolve
   `workoutExercise` na ordem física do Postgres. `PROGRAM_INCLUDE` (`program.service.ts:8`) e
   `SESSION_INCLUDE` (`workout-session.service.ts:25`) ordenam por `orderIndex`. Hoje é
   latente — o cliente reordena ao carregar —, mas é o tipo de coisa que um builder com
   múltiplos painéis expõe.

4. **O catálogo de exercícios é global e gravável por qualquer autenticado.**
   `exercise.routes.ts:12-15` — `POST`, `POST /bulk`, `PUT /:id`, `DELETE /:id` só exigem
   `authenticate`, sem dono e sem admin. Não é teórico: o seed tem 67 exercícios e o banco tem
   117, ids contíguos de 1 a 117 — **50 entraram por uso**. Um builder que estimula criar
   exercício amplifica isso.

### 1.2 Agrupamento em texto livre — o dado

18 dos 29 treinos têm `description` preenchida, mas só **3 codificam estrutura**, todos do
usuário 1, todos ativos:

| Treino | Trecho | O que é |
|---|---|---|
| 30 `Treino A - Exp` | "Rosca alternada e martelo - 2 x 2." / "Corda pulley e francês- 2 x 2." | dois bi-sets |
| 31 `Treino B - Exp` | "Rest pause em ombros." / "Alternar bíceps e tríceps." | rest-pause + alternância |
| 33 `Trein D - Exp` | "Alternar desenvolvimento e elevação." / "Bayesian - Coice - Martelo - Pulley. Rest pause." | alternância + cadeia de 4 |

Leitura honesta: **3 de 29 treinos no banco (10%), mas 3 dos 5 treinos ativos do único usuário
com prática séria (60%).** É lacuna real, não hipótese — e é de um usuário só.

O treino 30 também carrega a **progressão** em texto: *"Peso desafiador para 6 repetições,
progredir confortavelmente até a oitava."* Isso é exatamente `[targetReps, targetReps+2]` com
`targetReps = 6` — a faixa que o app **já deriva** (`cerebrum.md:99`). Ver §3.1.

### 1.3 As exposições por grupo muscular — confirmado, mas a causa é outra

O handoff atribui o problema a ter *"montado um split de 5 dias treinando 3,4x/semana"*
(`:74`). Medi, e a primeira leitura parecia confirmar: nos últimos 60 dias, GLUTES 0,35 e
HAMSTRINGS 0,70 exposições/semana.

**Mas essa janela mistura duas gerações de plano.** A linha do tempo é limpa, sem
intercalação: geração antiga de 16/06 a 11/07, geração `- Exp` de 13/07 a 06/08. Foi migração
de plano, não deriva. Medindo só a era atual (12 sessões, 13/07→06/08, **3,5 sessões/semana**):

| Grupo | Planejado (se rotacionasse os 5) | Real | Treinos que atingem |
|---|---|---|---|
| SHOULDERS | 2,1 | **2,3** | 3 de 5 |
| BICEPS / TRICEPS | 2,1 | **2,3** | 3 de 5 |
| CHEST | 1,4 | **1,5** | 2 de 5 |
| BACK | 1,4 | **1,5** | 2 de 5 |
| QUADRICEPS | 1,4 | **1,2** | 2 de 5 |
| HAMSTRINGS | 1,4 | **1,2** | 2 de 5 |
| GLUTES | 0,7 | **0,3** | **1 de 5** |

Para sete dos oito grupos, **o real bate com o planejado**. O plano não é o problema.

A exceção é GLUTES, e a causa é visível na distribuição de sessões da era: A=3, B=3, C=3,
D=2, **E=1**. `Treino E - Exp` é o único dia de posterior/glúteo, foi feito **uma vez em três
semanas e meia**, e por isso glúteo caiu para menos da metade do planejado. O usuário faz os
três primeiros treinos e afunila no fim do ciclo.

**Consequência para este estudo.** O erro que o handoff quer que o builder previna é de
montagem; o erro que o dado mostra é de aderência à rotação — que é precisamente o que
`Program` + `GET /programs/active/next` resolvem, e que ainda não foi adotado (premissa 8).

Isso **não** anula o valor de ver volume enquanto monta — mas muda o que a tela deve dizer. O
aviso útil não é *"você planejou 0,7"*; é **"GLUTES depende de exatamente 1 dos seus 5
treinos"**. Grupo servido por um único treino é ponto único de falha, e é isso que quebrou.

---

## 2. Mapa do que existe

### Stack real

| Camada | O que é |
|---|---|
| Monorepo | **npm workspaces puro** (`apps/*`, `packages/*`). Sem Turbo, sem Nx. Orquestração por `concurrently` |
| Build web | **Vite 7**, entrada única `index.html`, **sem `build.rollupOptions`**, sem code splitting — todas as 14 páginas são import estático (`App.tsx:5-22`) |
| Estilo | **Tailwind v4 CSS-first** — não existe `tailwind.config.js`. Todo o tema vive em `src/index.css` (606 linhas): tokens oklch, `@theme inline`, 14 pares `--muscle-*`, escala de radius |
| Componentes | **shadcn/ui** (`components.json`, estilo `radix-nova`) + `radix-ui` + `@base-ui/react`. 21 primitivos em `components/ui/` |
| Rotas | **wouter**, declaradas só em `App.tsx:32-91`, constantes em `core/constants/path.ts` |
| Estado servidor | **React Query** — `new QueryClient()` **sem defaults** (`App.tsx:24`); chaves inline, sem factory, mistura camelCase e kebab-case |
| Estado cliente | **Zustand**, com `persist` no store de auth e no rascunho do editor |
| Tipos | **Compartilhados de verdade** — o web importa `@plato/database/generated/prisma/models` direto (`workout.types.ts:1-8`). Sem codegen, sem duplicação |
| Matemática | `@plato/shared` — `e1rm`, `volume`, `effective-load`, `records`, com testes vitest |
| Deploy | `sirv dist --single` para o estático; API Express atrás de proxy. `cors()` aberto (`index.ts:21`) |

### Reaproveitável de graça por um builder

- Todos os tokens e o `@theme inline` de `index.css` — uma tela nova herda o sistema inteiro.
- Os 21 primitivos `ui/`, `MuscleBadge`, `useAppMutation`, `ErrorBoundary`.
- **`@dnd-kit` já instalado e já em uso em dois lugares** — editor de treino
  (`ExerciseList.tsx` + `useExerciseItemLogic.ts`) e pilha da sessão ativa. Sensores já
  incluem `MouseSensor`, então **arrastar com mouse já funciona hoje**.
- O rascunho persistido (`workout-editor.store.ts`) — independente de rota, com
  `arrayMove`, `orderIndex` re-sincronizado 1..n e `partialize`.
- `GET /exercises/:id/alternatives` (`exercise.service.ts:48-116`) — substitutos ranqueados
  por padrão de movimento, com desempate por histórico do usuário.
- `findRedundantGroups` — detecção de padrão repetido, client-side.
- **A classificação do catálogo está completa**: 0 dos 105 ativos tem `movementPattern`
  nulo. Os 10 sem `equipment` são exatamente os `(Padrão)`, nulos por definição.

### Não reaproveitável

`core/layout/Layout.tsx` inteiro. É coluna única, `p-4`, sem `max-w`, sem `mx-auto`, sem
grid. A `NavBar` é `w-screen` fixa de 92px, e há quatro barras de ação `inset-x-0`.
**O app tem zero breakpoints responsivos em código de aplicação** — os 21 prefixos
`sm:`/`md:`/`lg:` do projeto estão em primitivos shadcn e em dois arquivos de exemplo mortos
(`components/example.tsx`, `component-example.tsx`, ambos sem importador).

A 1440px nada quebra e nada se sustenta: tudo renderiza, esticado de ponta a ponta, com a
barra de navegação de celular cruzando a tela.

---

## 3. Lacunas de modelo que sobraram

Três, das cinco do Passo 2. As outras duas caíram nas premissas 1 e 2.

| Lacuna | Bloqueante p/ MVP? | Custo de migration | Telas impactadas |
|---|---|---|---|
| Faixa de reps / RPE / descanso | **Não** — e ver §3.1, provavelmente nem é lacuna | 0,5 dia se for coluna; alto se for por série | Editor, Sessão |
| Agrupamento (bi-set / tri-set) | **Não** | 0,5 dia (colunas) + 0,5 (espelho no snapshot) | Editor, **Sessão**, Resumo, Histórico |
| Duplicação de treino | **Não, mas é o de maior retorno** | **Zero** — não tem migration | Lista de treinos |

### 3.0 O que amarra as três: os ids de `WorkoutExercise` não são estáveis

`cerebrum.md:99` já registrava, e o código confirma: `workout.service.update` é
`deleteMany` + `createMany` (`workout.service.ts:76-82`). **Toda linha de `WorkoutExercise`
recebe id novo a cada save.**

Consequência que decide o resto deste documento: **qualquer tabela filha de
`WorkoutExercise` é destruída por cascade a cada save.** Prescrição por série
(`WorkoutExerciseSet`), grupo de bi-set com model próprio (`ExerciseGroup`) — nenhum
sobrevive a um salvamento do treino.

Ou seja, o Passo 2 (lacunas de modelo) e o Passo 3b (modelo de edição) do handoff **não são
duas perguntas**. Prescrição mais rica exige, antes, trocar replace por diff com identidade
estável. Isso é pré-requisito, não refinamento — e é a razão principal de o builder "de
verdade" não ser o próximo passo.

**Corolário útil:** enquanto a identidade não for resolvida, qualquer coisa nova de
prescrição precisa caber em **coluna nulável na própria `WorkoutExercise`**. Nada de tabela
filha. É por isso que as propostas abaixo são todas colunas.

### 3.1 Faixa de reps, RPE alvo, tempo de descanso — recomendo **não fazer**

**Proposta que eu descartaria:**
```prisma
model WorkoutExercise {
  targetRepsMax Int?    // faixa: targetReps..targetRepsMax
  targetRpe     Float?
  restSeconds   Int?
}
```

Custo baixo (aditivo, nulável, ~0,5 dia). Mas o dado não sustenta:

- **`targetReps` em uso: 4, 6, 8, 10, 12** — 107 das 148 linhas são 10 ou 12. A faixa já
  derivada é `[targetReps, targetReps+2]` (`cerebrum.md:99`), o que dá 6-8, 10-12, 12-14.
- O **único** caso de faixa escrita à mão no banco inteiro é o treino 30: *"desafiador para 6
  repetições, progredir até a oitava"* = 6-8. Que é **exatamente** o que a derivação já produz
  de `targetReps = 6`.

Ou seja, a faixa configurável resolveria um caso que já está resolvido. Adicionar a coluna
transformaria um invariante em três estados (`null` = derivar, igual = fixo, maior = faixa) e
espalharia essa condicional pela cadeia de progressão, que é a lógica mais delicada do app.

**RPE alvo:** `cerebrum.md:100` registra que RPE 8 é o *default do seletor*, não afirmação do
usuário. Não há como medir demanda por RPE alvo no dado atual, e prescrever RPE colide com a
progressão dupla reavaliada a cada série (`cerebrum.md:239`).

**Descanso:** zero evidência. Nenhuma das 18 descrições menciona tempo de descanso.

**Prescrição por série (top set + back-off):** exige tabela filha → bloqueado por §3.0. Fora.

### 3.2 Agrupamento — proposta, para quando for a hora

Duas colunas nuláveis, **sem tabela filha**, para sobreviver ao replace:

```prisma
enum ExerciseGroupType {
  SUPERSET     // bi-set / tri-set: alterna sem descanso entre eles
  ALTERNATING  // alterna entre séries, com descanso
  REST_PAUSE   // cadeia contínua
}

model WorkoutExercise {
  // Correlaciona exercícios do MESMO treino. Não é FK: precisa sobreviver ao
  // deleteMany+createMany do update, então é rótulo, não identidade.
  groupKey  String?
  groupType ExerciseGroupType?
}
```

`groupKey` como `String?` e não FK é deliberado: uma FK exigiria linha em outra tabela, que
o replace apagaria. Um rótulo (UUID gerado no cliente, junto com o `instanceId` que o store
já cria em `workout-editor.store.ts:11-17`) atravessa o `deleteMany`/`createMany` intacto.

**Precisa espelhar em `SessionExercise`** — as mesmas duas colunas. Sem isso o snapshot
perde o agrupamento e o Histórico volta a mentir sobre o que foi prescrito, que é o problema
que `SessionExercise` acabou de resolver. Precedente para adicionar já: `SessionExerciseOrigin`
nasceu com três valores justamente para não precisar de segunda migration numa tabela com
dados (`schema.prisma:203-205`).

**Alternativa rejeitada:** model `ExerciseGroup` com FK. Mais limpo no papel, morto na
prática por §3.0.

**Por que não é MVP:** o custo real não está no schema (1 dia), está em executar o
agrupamento na tela de Sessão — a mais delicada do app, com cadeia de prescrição, teclado e
foco. O doc anterior estimou a UI dessa tela em 3–5 dias com incerteza **alta**
(`design-flexibilidade…:378`). Agrupamento não é exceção.

### 3.3 Duplicação — fazer já

```
POST /api/workouts/:id/duplicate  →  201 { workout }
```

Sem migration. Serviço: `getById` + `ensureOwnership` + `create` com nome sufixado, dentro de
um `$transaction`. O padrão de posse (`ensureOwnership`, `shared/utils/auth.ts:10-22`) e o de
transação (`workout.service.ts:76`) já existem.

Evidência de que falta (premissa 9): o usuário 1 tem `Treino A…E` inativos e
`Treino A…E - Exp` ativos. Ele recriou os cinco à mão. Isso é o caso de uso, medido.

É o único item do estudo que **não depende de nada** — nem do builder, nem da identidade
estável, nem de tela nova. Melhora o app mobile de hoje.

---

## 4. Decisões de arquitetura

### (a) Onde mora o builder — recomendo uma quarta opção

**Recomendada: rotas novas no mesmo app, renderizadas fora do `<Layout>`, com shell desktop
próprio e `React.lazy`.**

O precedente já está no código: `/workout-complete/:id` renderiza **fora** do `Layout`
(`App.tsx:35`), justamente para escapar da NavBar. Um `/builder` faria o mesmo, com um
`BuilderLayout` de dois ou três painéis.

- Herda tokens, primitivos, tipos, serviços e auth sem esforço.
- `React.lazy` numa rota resolve o bundle: o celular não baixa o builder.
- Zero mudança em PWA, em `sirv`, em manifest, em CORS, em auth.

**Rejeitada — opção 1 do handoff (mesmo app, responsivo em `lg:`).** Duas razões. O app tem
zero breakpoints hoje, então "adicionar `lg:`" é reescrever o layout de todas as telas, não
ajustar. E o builder não quer o mesmo layout esticado — quer dois/três painéis simultâneos,
que é outra árvore de componentes. Tornar a lista de treinos responsiva é trabalho legítimo,
mas é outro projeto.

**Rejeitada — opção 2 (entrypoint separado `/builder.html`).** Mecanicamente viável, mas
paga três coisas: `workbox.navigateFallback: "/index.html"` (`vite.config.ts:37`) serviria o
documento errado para quem tem o service worker instalado, exigindo denylist; `sirv --single`
(`apps/web/package.json:9`) reescreve qualquer sub-rota de `/builder` para `index.html`; e o
manifest teria de ser separado. Tudo isso compra **só** separação de bundle — que o
`React.lazy` dá de graça.

**Rejeitada — opção 3 (subdomínio).** O token vive em localStorage, que é escopado por
origem. Em outro subdomínio o usuário loga de novo. "Resolver" isso empurra para cookie
httpOnly, o que reescreve a autenticação do app inteiro — incluindo o interceptor
(`core/api/index.ts:17-23`) e o `AuthGuard` — por causa de uma tela. Some-se dois deploys e
CORS explícito no lugar do `cors()` atual. Custo desproporcional.

### (b) Modelo de edição — manter save explícito

**Autosave: não.** Três razões, todas verificadas:

1. O rascunho **já persiste** em localStorage (`workout-editor.store.ts:126-133`). A
   segurança que o autosave normalmente compra — não perder trabalho — já existe, sem rede.
2. Com `PUT` de replace, autosave a cada drag é `DELETE` de N linhas + `INSERT` de N linhas
   **por gesto**. Num treino de 10 exercícios, arrastar três vezes são 60 escritas.
3. Save explícito é o que o editor faz hoje, e funciona.

**Endpoint granular (`PATCH /workouts/:id/exercises`): não, ainda.** Só passa a valer a pena
se o MVP incluir prescrição por série — e aí o pré-requisito é o diff com ids estáveis (§3.0),
não o `PATCH`. Fazer o granular sobre o replace atual seria construir a fachada sem a
fundação.

**Optimistic updates: não.** O save é uma ação deliberada, com feedback, uma vez por sessão de
edição. `useAppMutation` já invalida e já mostra erro. Optimistic aqui compra latência
percebida num lugar onde ninguém está esperando.

**Se e quando a identidade for resolvida**, o caminho é `PUT` com `id?` opcional por item:
item com `id` = update, sem `id` = create, ausente da lista = delete. Isso preserva o contrato
de "manda a lista inteira" (que o cliente já faz naturalmente) e ganha estabilidade de id sem
endpoint novo.

### (d) Autenticação

Com a opção (a) recomendada: **custo zero.** Mesma origem, mesmo localStorage, mesmo
interceptor, mesmo `AuthGuard`. Nada a fazer.

O token sem `expiresIn` (§1.1) é problema real e **não deve ser embutido neste escopo** —
resolvê-lo significa expiração + refresh + tratamento de 401 que hoje só faz `logout()` sem
limpar o cache do React Query (`core/api/index.ts:25-33`). É trabalho próprio, e misturá-lo
com uma tela nova é como o builder herdaria um risco que não criou.

---

## 5. O que a tela grande realmente habilita

Separando honestamente, contra o que já existe:

**Só a tela grande resolve**
- Catálogo lado a lado com o treino em construção (hoje é bottom sheet de 90dvh que cobre o
  que você está montando).
- Ver os 5–6 treinos do programa ao mesmo tempo, para equilibrar volume entre eles.
- Editar dois treinos sem ida-e-volta de navegação.

**Já existe, e não depende de tela grande**
- Detecção de redundância — `findRedundantGroups`, rodando no editor mobile.
- Sugestão de substitutos — `GET /exercises/:id/alternatives`, com ranking e motivo.
- Arrastar para reordenar — `@dnd-kit` com `MouseSensor` já configurado.

**O recurso de maior valor do handoff — e ele também não depende de tela grande**

O `builder.md:74` chama o volume semanal por grupo muscular de "provavelmente o recurso de
maior valor", e concordo. Mas ele cabe inteiro no editor mobile de hoje: é uma lista de 8–10
barras, que é exatamente o que `TrainingDistributionChart` já renderiza no perfil.

Três ressalvas de implementação:
- A matemática é **nova**. `packages/shared/src/volume.ts` é tonelagem executada
  (`peso × reps`); o que se precisa é **séries planejadas prospectivas** — somar `targetSets`
  por `targetMuscle` sobre os treinos do ciclo. Função nova, mas trivial e pura, com lugar
  óbvio em `@plato/shared`.
- Cruzar com `secondaryMuscles` ou não é decisão de produto. Recomendo **não** no primeiro
  corte: contar músculo secundário como exposição infla o número e é discutível.
- O aviso que importa, pela §1.3, não é o total — é **"este grupo depende de 1 só treino"**.
  Um grupo servido por um único treino do ciclo é ponto único de falha, e foi o que quebrou
  glúteo. Essa é a regra que teria previsto o problema real.

---

## 6. Escopo do MVP

Se o builder for feito — e a recomendação é adiar —, o menor recorte que já é melhor que
montar no celular:

1. Rota `/builder` fora do `Layout`, shell de dois painéis, `React.lazy`.
2. Painel esquerdo: catálogo com busca e filtro por grupo, reusando `useExercises`.
3. Painel direito: o treino em construção, reusando `workout-editor.store` inteiro.
4. Drag entre painéis (`@dnd-kit` já suporta; hoje só há sort de lista única).
5. Painel de volume planejado por grupo, com o aviso de ponto único de falha.
6. Save explícito pelo `PUT` atual.

**Fora do MVP:** agrupamento, faixa de reps, RPE, descanso, prescrição por série, edição de
múltiplos treinos ao mesmo tempo, endpoint granular.

Note que os itens 5 e 6 — e boa parte do valor — não precisam dos itens 1 a 4.

---

## 7. Estimativas

Faixas em **dias de trabalho focado**, um desenvolvedor já familiarizado com o repositório.
Incerteza declarada por linha. Mesma convenção de `design-flexibilidade…:356`.

### Fazer agora (não depende do builder)

| Item | Faixa | Incerteza |
|---|---|---|
| `POST /workouts/:id/duplicate` + botão na lista | **0,5–1** | Baixa |
| Volume planejado por grupo: função em `@plato/shared` + testes | 0,5–1 | Baixa |
| Volume planejado: UI no editor + aviso de ponto único de falha | 1–2 | Média |
| **Total** | **2–4** | |

### Builder, se for feito

| Item | Faixa | Incerteza |
|---|---|---|
| Rota fora do `Layout` + `BuilderLayout` de dois painéis + `React.lazy` | 1–2 | Baixa |
| Painel de catálogo (busca, filtro, virtualização se passar de 105) | 1,5–2,5 | Média |
| Drag entre painéis (`DragOverlay`, dois `SortableContext`, sensor de teclado) | 2–3,5 | **Alta** — nada disso existe hoje; os dois usos atuais são sort de lista única |
| Painel de volume no contexto do builder | 0,5–1 | Baixa (reusa o item acima) |
| Ajustes no app existente (`orderBy` no include, rota, path constant) | 0,5 | Baixa |
| **Total** | **5,5–9,5** | |

### Agrupamento, se for feito

| Item | Faixa | Incerteza |
|---|---|---|
| Migration: 2 colunas em `WorkoutExercise` + 2 em `SessionExercise` + enum | 0,5–1 | Baixa |
| API: Zod, mapeamento, propagação ao snapshot no início da sessão | 1–1,5 | Baixa |
| UI do editor: agrupar/desagrupar, representação visual | 1,5–2,5 | Média |
| **UI da Sessão: executar bi-set / rest-pause** | **3–5** | **Alta** — tela mais delicada do app |
| Badges em Resumo e Histórico | 1–2 | Média |
| **Total** | **7–12** | |

### Identidade estável (pré-requisito de qualquer prescrição rica)

| Item | Faixa | Incerteza |
|---|---|---|
| `PUT` com `id?` por item: diff update/create/delete em transação | 1,5–2,5 | Média |
| `@@unique([workoutId, orderIndex])` + normalização no servidor | 0,5 | Baixa |
| Ajuste do cliente para enviar `id` dos itens carregados | 0,5–1 | Baixa |
| **Total** | **2,5–4** | |

---

## 8. Riscos

**O que pode quebrar no app existente**
- Uma rota `/builder` fora do `Layout` não toca nenhuma tela atual. É o desenho de menor
  superfície de risco — e a razão principal de recomendá-lo.
- Mexer no `Layout` para torná-lo responsivo, ao contrário, toca as 14 páginas de uma vez.

**O que é irreversível**
- Migrations de enum em Postgres (`ExerciseGroupType`) não têm rollback limpo.
- Adicionar coluna ao `SessionExercise` depois que ele tiver volume de dados é mais caro do
  que agora — hoje são **3 sessões com snapshot contra 82 legadas**, então a janela barata
  está aberta e vai fechando.

**Dependências e dívidas que o builder herdaria**
- Os **10 `(Padrão)` ainda visíveis** no picker, todos com histórico. O builder expõe o
  catálogo mais que qualquer tela atual. Não bloqueia, mas é a primeira coisa que o usuário vê.
- O **catálogo global gravável por qualquer autenticado** (§1.1) — 50 exercícios já entraram
  por uso. Um builder aumenta a taxa.
- `WORKOUT_INCLUDE` sem `orderBy` (§1.1).
- `db:sync` na raiz ainda roda `prisma db push` e o `DATABASE_URL` local aponta para
  produção (`cerebrum.md:156`). Com migrations baselinadas desde 10/08, esse script é uma
  armadilha aberta, independente deste estudo.
- PWA com `orientation: "portrait"` e `start_url: "/"` (`vite.config.ts:19-21`) — inofensivo
  para navegador desktop, relevante se um dia o builder for instalável.

**O que não é risco, apesar de parecer**
- `WorkoutExercise` sem `@@unique([workoutId, orderIndex])`: medi, **zero treinos** têm índice
  duplicado ou não-contíguo. O cliente re-sincroniza 1..n corretamente
  (`workout-editor.store.ts:110-121`). É invariante não-imposto, não dano — vale fechar junto
  com a identidade estável, não antes.

---

## 9. Recomendação final

**Adiar o builder. Fazer antes três coisas que não precisam dele.**

O handoff diz que *"fazer, mas só depois de X"* é resposta válida. É essa, e o X tem duas
partes — uma de produto e uma técnica.

**Parte de produto.** O dado não sustenta que montar treino seja onde o usuário perde. Ele
montou 5 treinos de 5 a 10 exercícios, e para sete dos oito grupos musculares o volume real
bate com o planejado (§1.3). O que quebrou foi glúteo, porque depende de um único treino que
ele fez uma vez em três semanas e meia. Isso é aderência à rotação, não montagem — e a
ferramenta para isso (`Program`, com sugestão de próximo treino) foi entregue em 10/08 e ainda
tem **zero adoção** pelo usuário 1.

Construir uma superfície nova para um problema enquanto a ferramenta do problema real está
parada sem uso é a ordem errada.

**Parte técnica.** O builder que justifica a tela grande é o que edita prescrição rica. Essa
é bloqueada por §3.0: enquanto `workout.service.update` for `deleteMany`+`createMany`, nenhuma
tabela filha de `WorkoutExercise` sobrevive a um save. Fazer o builder antes de resolver isso
significa construir a UI e depois descobrir que o modelo não aceita o que ela quer editar.

### Ordem recomendada

```
0. POST /workouts/:id/duplicate                          0,5–1 dia   [fazer já, independente]
1. Volume planejado por grupo, no editor atual           1,5–3       [fazer já — é o recurso
                                                                      de maior valor do handoff]
   ─────────────────────── reavaliar aqui ───────────────────────
2. Identidade estável (PUT com id? + @@unique)           2,5–4       [pré-requisito]
3. Agrupamento (colunas + snapshot + Sessão)             7–12
4. Builder web-desktop                                   5,5–9,5
5. Faixa de reps / RPE / descanso                        fora — ver §3.1
6. Prescrição por série (top set + back-off)             fora
```

**O ponto de reavaliação depois do item 1 é o que importa.** Entregues duplicação e volume
planejado, boa parte da dor descrita no handoff some sem tela nova, por **2 a 4 dias**. Se
depois disso montar treino ainda doer — e é possível que doa, porque catálogo lado a lado é
genuinamente melhor —, aí o builder se justifica, com o pré-requisito já resolvido e com
evidência real em vez de hipótese.

**A condição que mudaria esta recomendação:** se o agrupamento passar a aparecer em mais
usuários (hoje é 1), ou se o usuário 1 adotar `Program` e o volume continuar desequilibrado
mesmo com a rotação cumprida. A primeira é observável no `Workout.description`; a segunda,
repetindo a medição de §1.3 daqui a um bloco.

---

## Apêndice — o que foi medido

Consultas `SELECT` em produção (Supabase, `DIRECT_URL`, porta 5432) em 2026-08-11. Números
que corrigem ou confirmam o handoff:

| Métrica | Valor |
|---|---|
| Exercícios no catálogo | 117 (12 depreciados, **105 ativos**) |
| Ativos sem `movementPattern` | **0** — classificação completa |
| Ativos sem `equipment` | 10 — exatamente os `(Padrão)`, nulos por definição |
| `(Padrão)` ainda no picker | **10** de 22, todos com histórico |
| Treinos | 29, de 7 usuários |
| Linhas de `WorkoutExercise` | 148 |
| `WorkoutExercise.observation` preenchida | **0 de 148** |
| Maior treino do banco | **10 exercícios** (handoff supõe 14) |
| Treinos ativos do usuário 1 | 5, com 6/8/5/10/6 exercícios |
| Treinos com estrutura em texto livre | 3 (todos do usuário 1, todos ativos) |
| Treinos com `orderIndex` duplicado ou com buraco | **0** |
| Programas no banco | **1**, do usuário 7 (de teste) |
| Treinos pertencentes a algum programa | 3 de 29 |
| Sessões | 85 — **3 com snapshot, 82 legadas** |
| Cadência do usuário 1 na era atual | 12 sessões, 13/07→06/08, **3,5/semana** |
| Sessões por treino na era atual | A=3, B=3, C=3, D=2, **E=1** |
| Exposições/semana reais | SHOULDERS 2,3 · BICEPS 2,3 · TRICEPS 2,3 · CHEST 1,5 · BACK 1,5 · QUADS 1,2 · HAMS 1,2 · **GLUTES 0,3** |
| `targetReps` em uso | 4, 6, 8, 10, 12 (107 das 148 são 10 ou 12) |
| `targetSets` em uso | 1, 2, 3, 4, 10 (118 das 148 são 3) |
