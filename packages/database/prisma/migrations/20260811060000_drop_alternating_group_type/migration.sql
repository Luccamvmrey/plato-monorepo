-- Remove `ALTERNATING` de ExerciseGroupType. Na execução ele era idêntico a
-- `SUPERSET` — os dois revezam série a série entre os exercícios —, e uma distinção
-- que não muda comportamento é só mais um campo para preencher errado.
--
-- NÃO é aditiva: converte dado. Medido em 2026-08-11 antes de rodar, 2 linhas de
-- `WorkoutExercise` (um grupo) usavam ALTERNATING; `SessionExercise` estava sem
-- nenhuma. A conversão para SUPERSET preserva o comportamento, porque os dois já
-- executavam igual.
--
-- A primeira versão desta migration pulou o UPDATE, apostando numa contagem feita
-- antes de a feature ser usada, e morreu em `22P02 invalid input value for enum`. O
-- rollback foi completo (DDL em Postgres é transacional), mas a lição fica: contar
-- linhas antes de a tela existir não diz nada sobre o que há nelas depois.
--
-- O UPDATE precisa vir ANTES da troca de tipo: depois, o `USING` teria de converter
-- um valor que o tipo novo não conhece, que é exatamente onde a primeira tentativa
-- estourou.

-- Converte o dado enquanto a coluna ainda aceita o valor antigo
UPDATE "WorkoutExercise" SET "groupType" = 'SUPERSET' WHERE "groupType" = 'ALTERNATING';
UPDATE "SessionExercise" SET "groupType" = 'SUPERSET' WHERE "groupType" = 'ALTERNATING';

-- AlterEnum
-- Postgres não tem DROP VALUE em enum, então o tipo é recriado.
ALTER TYPE "ExerciseGroupType" RENAME TO "ExerciseGroupType_old";

CREATE TYPE "ExerciseGroupType" AS ENUM ('SUPERSET', 'REST_PAUSE');

ALTER TABLE "WorkoutExercise"
    ALTER COLUMN "groupType" TYPE "ExerciseGroupType"
    USING "groupType"::text::"ExerciseGroupType";

ALTER TABLE "SessionExercise"
    ALTER COLUMN "groupType" TYPE "ExerciseGroupType"
    USING "groupType"::text::"ExerciseGroupType";

DROP TYPE "ExerciseGroupType_old";
