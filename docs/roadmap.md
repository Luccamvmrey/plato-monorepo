# Plato: roadmap de produto e monetização

> Versão de 03/11/2026. As durações são estimativas em dias de desenvolvimento. Cada fase recebe plano próprio antes de começar.

## Contexto

O objetivo é diminuir o atrito na academia e começar a cobrar pelo app.

**Decisões já tomadas:**
- Quem paga primeiro é o praticante dedicado.
- O app segue como PWA até as métricas justificarem o nativo.
- O modo simplificado v1 tem um toque por série e um peso opcional no fim do exercício.

**Ordem recomendada:** começar pela Fase 0 (fundação) e depois fazer o modo simplificado. A tela de bloqueio nativa fica para o fim.

| Fase | Foco | Estimativa | Condição para começar |
|---|---|---|---|
| 0 | Fundação | 3 a 5 dias | Nenhuma |
| 1 | Menos atrito na academia | 7 a 11 dias | Fase 0 concluída |
| 2 | Aquisição | 6 a 9 dias | Fase 1 concluída |
| 3 | Retenção | 5 a 8 dias | Fase 2 concluída |
| 4 | Cobrança | 5 a 8 dias | Retenção saudável e interesse real dos usuários ativos |
| 5 | App nativo | 15 a 25 dias | Tela de bloqueio como pedido recorrente ou motivo real de assinatura |

## O que o código mostrou

| Fato | Consequência |
|---|---|
| `GET /users` devolve id, nome e e-mail de **todos** os usuários a qualquer pessoa logada (`user.routes.ts:25`, `user.service.ts:6`) | Vazamento de dados real. Corrigir antes de crescer |
| O JWT não expira (`auth.utils.ts:18`) | Não dá para encerrar uma sessão roubada. Inaceitável com assinatura paga |
| Não há recuperação de senha, envio de e-mail, analytics nem termos/privacidade | Usuário pagante perde o acesso sem saída, e não há como medir conversão |
| `SessionSet.actualWeight` e `rpe` são obrigatórios; são 85 ocorrências em 24 arquivos, incluindo testes e MCP | O modo simplificado mexe em dados e analytics, não só na tela |
| As séries ficam em `pendingSets` no localStorage até o `POST /finish` | Um service worker não lê localStorage, então marcar série fora do app exige mudar esse fluxo |
| Não há push, agendador nem billing | Notificações e cobrança começam do zero |
| `Exercise` é um catálogo global; `workout.service.update` apaga e recria as linhas | Compartilhar tem que **copiar**, nunca referenciar o treino de outra pessoa |
| Medição de agosto: 18 usuários, 6 com histórico, `Program` praticamente sem uso | Remedir na Fase 0. Validar com usuários antes de cobrar ou construir mais |

## Avaliação das ideias

| Ideia | Vale a pena? | Custo | Observação |
|---|---|---|---|
| Modo simplificado | Sim | Médio | Abre público novo e é pré-requisito da tela de bloqueio. Traz mais usuários do que receita direta |
| Marcar série na tela de bloqueio | Sim, mas depois | Alto | Tudo indica que o iPhone exige nativo, e isso precisa de Mac e conta Apple |
| Lembrete para treinar | Sim | Médio | Baseado na cadência real, não em dia fixo: "faz 3 dias, próximo: Treino B" |
| Resumo semanal e mensal | Sim | Baixo a médio | Bom custo-benefício; por e-mail funciona sem instalar nada. O detalhado pode ser Pro |
| Compartilhar treinos | Sim | Baixo a médio | É o canal de aquisição: cada link leva a uma página pública com cadastro |
| Treinos sugeridos | Sim | Médio | Usa a mesma base do compartilhamento. Sugerir **programas** completos, o que também testa se `Program` ganha uso. O conteúdo precisa de revisão humana |

## Fases

### Fase 0: fundação (3 a 5 dias)

Não aparece para o usuário, mas é pré-requisito para cobrar.

> **Situação em 03/11/2026:** código commitado na `develop`, migration aplicada e chave do Resend na VPS. Falta fazer o deploy, testar a recuperação de senha de ponta a ponta, revisar os textos legais e conversar com os usuários. A falha de posse em `POST /sessions/sets` já estava corrigida. O analytics ficou em `packages/database/prisma/metrics.sql`, sem ferramenta de terceiros.
>
> **Medição de 03/11/2026:** 19 usuários, 7 com treino concluído, 3 ativos por semana e 1 cadastro em 12 semanas.

- Restringir ou remover `GET /users`. **É o primeiro item.**
- Dar expiração ao JWT, com renovação que não derrube a sessão durante o treino.
- Reconferir as falhas registradas em agosto: escrita aberta no catálogo de exercícios e posse em `POST /sessions/sets`.
- Adicionar recuperação de senha e provedor de e-mail transacional.
- Adicionar analytics mínimo: cadastro, início e fim de treino, retenção semanal.
- Publicar termos e política de privacidade (LGPD). Exportação e exclusão de conta já existem. Dados de saúde e peso corporal merecem revisão jurídica.
- Remedir o uso real e **conversar com os usuários ativos**.

### Fase 1: menos atrito na academia (7 a 11 dias)

> **Situação em 04/11/2026:** implementada. Testada de ponta a ponta com banco descartável e no viewport de celular, mas ainda não num aparelho real.
>
> **Limites conhecidos:** o iPhone não vibra ao fim do descanso (aviso só visual); com a tela apagada ou o app em segundo plano não há aviso, o que depende das notificações da Fase 3. Exercício feito só no modo simplificado aparece na análise como "ainda não realizado", porque ela depende de peso e RPE medidos.

**Ganhos rápidos, sem loja (2 a 3 dias):**
- Tela sempre ligada durante o treino (Wake Lock).
- Timer de descanso com vibração, automático depois de cada série e só no fim da rodada em bi-sets.

**Modo simplificado (5 a 8 dias):**
- Criar o enum `TrackingMode { FULL, SIMPLE }` como preferência em `User`, copiada para `WorkoutSession` no início, como o snapshot já faz.
- Tornar `actualWeight` e `rpe` anuláveis. Não gravar `0` nem `8` como valor padrão: 0 kg é carga legítima e o RPE 8 seria inventado.
- Preencher `actualReps` com as reps previstas e aplicar o peso opcional às séries do exercício.
- Gravar com `excludedFromRecords = true` na v1, porque as reps são presumidas e não devem alimentar PR, e1RM nem progressão. A flag já existe e o histórico já a filtra.
- Tratar peso ausente como `null` e pular a série nos cálculos, como `effectiveLoad` já faz. Mostrar o volume como "estimado".
- Bi-set reutiliza o revezamento de `buildExerciseStack`.
- Reutilizar `POST /sessions/:id/finish`.

### Fase 2: aquisição (6 a 9 dias)

- **Compartilhamento por link:** snapshot imutável com token aleatório e página pública fora do `AuthGuard`. Cobre treino e programa, preserva `groupKey` e não expõe dados do autor. "Adicionar" cria cópias próprias.
- **Treinos sugeridos:** os mesmos snapshots, com destaque e foco (ex.: glúteo, ombros, 3x por semana). Começar com 5 a 8 programas revisados por alguém com credibilidade.
- **Importar do Hevy e do Strong (CSV):** reduz o custo de troca para o público pagante. Confirmar antes os formatos atuais de exportação.

### Fase 3: retenção (5 a 8 dias)

- Criar `PushSubscription`, `User.timezone` e preferências de notificação, sempre com opt-in.
- Adicionar um agendador no VPS, garantindo uma única execução mesmo sob PM2.
- Lembrete com `estimateSessionsPerWeek` e `GET /programs/active/next`.
- Resumos com a matemática de `@plato/shared`, por push e e-mail.
- **Limite:** no iPhone, o web push só funciona com o app instalado na tela inicial. O e-mail cobre esse caso.

### Fase 4: cobrança (5 a 8 dias)

**Só começar se** a retenção estiver saudável e os usuários ativos demonstrarem interesse real, de preferência com pré-venda. Definir o número exato com os dados da Fase 0.

- Cobrar pela web, com cartão e Pix, sem comissão de loja. Escolher o gateway nesta fase.
- Criar `Subscription`, webhooks e o controle de acesso aos recursos Pro.
- Oferecer período de teste e preço de fundador aos primeiros usuários.

### Fase 5: nativo (15 a 25 dias, condicional)

**Só começar se** a tela de bloqueio aparecer como pedido recorrente ou motivo real de assinatura.

1. Enviar cada série ao servidor conforme é feita (ou usar armazenamento compartilhado). Isso também protege contra perda de dados.
2. Android com Capacitor: notificação persistente com tempo de treino e botão de marcar série.
3. iOS: Live Activity em extensão Swift. Precisa de Mac e conta Apple.

No modo completo, o toque confirma os valores sugeridos pelo motor de progressão. No simplificado, marca a série como feita.

Testar push e botões em aparelho real antes de fechar o escopo: as fontes sobre PWA no iOS são secundárias.

## Monetização

Hevy e Strong têm registro ilimitado de treinos no plano grátis e custam pouco, então **cobrar por registrar treino não funciona**. O Plato deve cobrar pela inteligência sobre os dados.

| Grátis | Pro |
|---|---|
| Registro ilimitado, modos completo e simplificado | Analytics avançado e histórico completo de e1RM e volume |
| Progressão básica, timer de descanso | Painel de volume planejado x executado, alertas de plano |
| Compartilhar e adicionar treinos, treinos sugeridos | Resumo mensal detalhado com comparativos |
| Exportar seus dados | Coach com IA via MCP |
| Resumo semanal simples | Tela de bloqueio, quando existir |

**Preço inicial a testar (hipótese):** R$ 12,90/mês ou R$ 89/ano. Pela conversão direta, isso fica abaixo dos valores em dólar dos concorrentes, mas o preço local deles precisa ser conferido.

**Referência de preço (fontes de terceiros, às vezes conflitantes):**
- Hevy Pro: de US$ 2,99 a 4,99/mês, de US$ 23,99 a 39,99/ano, US$ 74,99 vitalício.
- Strong Pro: US$ 4,99/mês, US$ 29,99/ano, US$ 99,99 vitalício.

**Vantagens difíceis de copiar:** o motor de progressão, a matemática de carga bem resolvida (peso corporal, assistido) e o MCP. O MCP é especialmente interessante porque o usuário usa o próprio Claude e o Plato não paga pela inferência, embora o público seja de nicho. Pagamento dentro do app só vira questão na Fase 5.

**Lojas:** no Brasil, um acordo com o Cade prevê pagamentos externos no iOS, com taxas noticiadas de 5% + 25% na compra pela App Store e 15% para links externos. Não confirmei se já está em vigor nem pesquisei as regras do Google. Rever na Fase 5.

## Outras funcionalidades em discussão

| Ideia | Opinião |
|---|---|
| Modo offline robusto | **Forte candidata:** academia costuma ter sinal ruim e a API é `NetworkOnly`. Pode entrar na Fase 1 se os usuários confirmarem o problema |
| Painel para personal trainers | **Maior aposta de ticket depois da validação:** o compartilhamento já é o primeiro passo. Testar com 3 a 5 personais antes de construir |
| Detecção de estagnação e sugestão de deload | **Boa para o Pro:** nasce do motor de progressão atual |
| Calculadora de anilhas | **Barata e útil:** pequena melhoria para o público dedicado |
| Apple Health e Health Connect | **Só depois do nativo** |
| Apple Watch | **Depois:** caro; só se o nativo der certo |
| Fotos de progresso | **Depois:** custo de armazenamento e dados sensíveis |
| Feed social | **Evitar por agora:** exige moderação e massa crítica que o app ainda não tem |
| Anúncios | **Evitar:** pouca receita nessa escala e mais atrito, justamente o que se quer reduzir |

## Cuidados ao executar

- Rodar `npm test`, `npm run build -w apps/web` com o dev server parado e o lint, comparando com os erros já existentes.
- Testar o modo simplificado no viewport mobile, confirmando que não cria PR nem altera a progressão do modo completo.
- O `DATABASE_URL` local aponta para o banco real. Fazer backup e usar `prisma migrate`, nunca `db push`.
- `finishSession` grava PRs reais, então testes contra esse banco precisam limpar os registros criados.

## Fontes

- Live Activities no ActivityKit: [Pushwoosh](https://www.pushwoosh.com/blog/ios-live-activities/), [Customer.io](https://docs.customer.io/integrations/sdk/ios/push/live-activities/)
- Limitações de PWA no iOS: [MagicBell](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)
- Acordo Apple e Cade: [MacMagazine](https://macmagazine.com.br/post/2025/12/23/apple-permitira-compras-externas-e-lojas-alternativas-a-app-store-no-brasil/), [TecMundo](https://www.tecmundo.com.br/mercado/409508-apple-e-obrigada-a-abrir-iphone-para-compras-fora-da-app-store-no-brasil.htm)
- Preços e plano grátis: [SensAI, Hevy](https://www.sensai.fit/pt/blog/hevy-review-2026), [SensAI, Strong](https://www.sensai.fit/blog/strong-app-review-2026), [Boostcamp](https://www.boostcamp.app/alternatives/hevy), [AI Tools Bakery](https://aitoolsbakery.com/blog/hevy-vs-strong-app/)
