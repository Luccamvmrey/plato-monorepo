-- Agrupamento de exercícios: bi-set, tri-set, rest-pause. Puramente ADITIVA — as
-- quatro colunas nascem NULL nas 148 linhas de WorkoutExercise e nas 3 de
-- SessionExercise, e nenhuma linha existente é lida ou reescrita. Treino sem
-- agrupamento continua exatamente como está.
--
-- `groupKey` é TEXT e não FK de propósito: `workout.service.update` é
-- deleteMany + createMany, então uma tabela de grupo seria apagada por cascade a cada
-- save do treino. O rótulo viaja na própria linha e sobrevive ao replace.
--
-- As colunas entram em SessionExercise na mesma migration porque a tabela ainda tem
-- 3 linhas contra 82 sessões legadas — adicioná-las depois, com volume, é mais caro.

-- CreateEnum
CREATE TYPE "ExerciseGroupType" AS ENUM ('SUPERSET', 'ALTERNATING', 'REST_PAUSE');

-- AlterTable
ALTER TABLE "WorkoutExercise" ADD COLUMN     "groupKey" TEXT,
ADD COLUMN     "groupType" "ExerciseGroupType";

-- AlterTable
ALTER TABLE "SessionExercise" ADD COLUMN     "groupKey" TEXT,
ADD COLUMN     "groupType" "ExerciseGroupType";
