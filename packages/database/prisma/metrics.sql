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

ROLLBACK;
