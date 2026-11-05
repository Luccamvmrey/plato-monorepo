-- Métricas de uso do Plato. Somente leitura e só agregados, sem dados pessoais.
-- Rodar com a DIRECT_URL:  psql "<DIRECT_URL>" -f packages/database/prisma/metrics.sql
BEGIN TRANSACTION READ ONLY;

\echo '=== Totais ==='
SELECT
    (SELECT count(*) FROM "User") AS usuarios,
    (SELECT count(DISTINCT "userId") FROM "WorkoutSession" WHERE "completedAt" IS NOT NULL) AS com_treino_concluido,
    (SELECT count(*) FROM "WorkoutSession" WHERE "completedAt" IS NOT NULL) AS sessoes_concluidas,
    (SELECT count(*) FROM "WorkoutSession" WHERE "completedAt" IS NULL) AS sessoes_abertas,
    (SELECT count(DISTINCT "userId") FROM "Program") AS usuarios_com_programa;

\echo '=== Por semana (ultimas 12) ==='
WITH semanas AS (
    SELECT generate_series(date_trunc('week', now()) - interval '11 weeks', date_trunc('week', now()), interval '1 week') AS semana
)
SELECT
    s.semana::date AS semana,
    (SELECT count(*) FROM "User" u WHERE date_trunc('week', u."createdAt") = s.semana) AS cadastros,
    (SELECT count(*) FROM "WorkoutSession" w WHERE date_trunc('week', w."startedAt") = s.semana) AS treinos_iniciados,
    (SELECT count(*) FROM "WorkoutSession" w WHERE date_trunc('week', w."completedAt") = s.semana) AS treinos_concluidos,
    (SELECT count(DISTINCT w."userId") FROM "WorkoutSession" w WHERE date_trunc('week', w."completedAt") = s.semana) AS usuarios_ativos
FROM semanas s
ORDER BY s.semana;

\echo '=== Retencao: dos cadastrados ha pelo menos N semanas, quantos treinaram depois disso ==='
SELECT
    n.semanas,
    count(*) AS elegiveis,
    count(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM "WorkoutSession" w
        WHERE w."userId" = u.id
          AND w."completedAt" >= u."createdAt" + n.semanas * interval '1 week'
    )) AS retidos
FROM (VALUES (1), (2), (4), (8)) AS n(semanas)
JOIN "User" u ON u."createdAt" <= now() - n.semanas * interval '1 week'
GROUP BY n.semanas
ORDER BY n.semanas;

\echo '=== Links: criados por usuarios e funil de aquisicao ==='
SELECT
    (SELECT count(*) FROM "SharedPlan" WHERE "userId" IS NOT NULL) AS links_criados,
    (SELECT count(*) FROM "SharedPlan" WHERE "userId" IS NOT NULL AND "revokedAt" IS NOT NULL) AS links_revogados,
    (SELECT coalesce(sum("viewCount"), 0) FROM "SharedPlan") AS visitas,
    (SELECT count(*) FROM "User" WHERE "signupPlanId" IS NOT NULL) AS cadastros_por_link,
    (SELECT count(DISTINCT w."userId") FROM "Workout" w WHERE w."sourcePlanId" IS NOT NULL) AS usuarios_que_adicionaram,
    (SELECT count(DISTINCT s."userId")
       FROM "WorkoutSession" s
       JOIN "Workout" w ON w.id = s."workoutId"
      WHERE w."sourcePlanId" IS NOT NULL AND s."completedAt" IS NOT NULL) AS concluiram_treino_copiado;

\echo '=== Programas sugeridos ==='
SELECT
    p."curatedKey" AS programa,
    p."viewCount" AS visitas,
    (SELECT count(*) FROM "Program" c WHERE c."sourcePlanId" = p.id) AS adicoes,
    (SELECT count(*) FROM "User" u WHERE u."signupPlanId" = p.id) AS cadastros
FROM "SharedPlan" p
WHERE p."curatedKey" IS NOT NULL
ORDER BY p."featuredOrder" NULLS LAST;

\echo '=== Notificacoes: aparelhos e adocao ==='
SELECT
    count(*) FILTER (WHERE endpoint LIKE '%.push.apple.com/%') AS aparelhos_iphone,
    count(*) FILTER (WHERE endpoint NOT LIKE '%.push.apple.com/%') AS aparelhos_outros,
    count(DISTINCT "userId") AS usuarios_com_push,
    count(DISTINCT "userId") FILTER (WHERE EXISTS (
        SELECT 1 FROM "WorkoutSession" w
        WHERE w."userId" = s."userId" AND w."completedAt" >= now() - interval '28 days'
    )) AS ativos_28d_com_push,
    (SELECT count(DISTINCT w."userId") FROM "WorkoutSession" w WHERE w."completedAt" >= now() - interval '28 days') AS ativos_28d,
    (SELECT count(*) FROM "NotificationPreference" WHERE "promptDismissedAt" IS NOT NULL) AS convites_recusados,
    (SELECT count(*) FROM "NotificationPreference" WHERE NOT "remindersEnabled") AS lembretes_desligados,
    (SELECT count(*) FROM "NotificationPreference" WHERE "emailSummaryEnabled") AS resumo_por_email
FROM "PushSubscription" s;

\echo '=== Notificacoes: envios por tipo ==='
SELECT
    kind,
    channel,
    count(*) FILTER (WHERE status = 'SENT') AS enviadas,
    count(*) FILTER (WHERE status = 'FAILED') AS falhas,
    count(*) FILTER (WHERE "openedAt" IS NOT NULL) AS abertas
FROM "NotificationLog"
GROUP BY kind, channel
ORDER BY kind, channel;

\echo '=== Lembretes: voltou a treinar em ate 48h ==='
SELECT
    count(*) AS lembretes,
    count(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM "WorkoutSession" w
        WHERE w."userId" = l."userId"
          AND w."completedAt" BETWEEN l."createdAt" AND l."createdAt" + interval '48 hours'
    )) AS treinou_em_48h
FROM "NotificationLog" l
WHERE l.kind = 'REMINDER' AND l.status = 'SENT';

ROLLBACK;
