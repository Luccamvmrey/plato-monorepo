-- Snapshot da prescrição por sessão. Puramente ADITIVA: nenhuma linha existente é
-- lida ou reescrita. As 82 sessões anteriores ficam sem SessionExercise de propósito
-- (reconstruí-las a partir do WorkoutExercise atual seria inventar prescrição), e as
-- 1112 séries existentes ficam com sessionExerciseId NULL = histórico legado.

-- CreateEnum
CREATE TYPE "SessionExerciseOrigin" AS ENUM ('PRESCRIBED', 'SUBSTITUTED', 'AD_HOC');

-- AlterTable
ALTER TABLE "SessionSet" ADD COLUMN     "sessionExerciseId" INTEGER;

-- CreateTable
CREATE TABLE "SessionExercise" (
    "id" SERIAL NOT NULL,
    "workoutSessionId" INTEGER NOT NULL,
    "exerciseId" INTEGER NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "targetSets" INTEGER NOT NULL,
    "targetReps" INTEGER NOT NULL,
    "observation" TEXT,
    "origin" "SessionExerciseOrigin" NOT NULL DEFAULT 'PRESCRIBED',
    "substitutedForId" INTEGER,
    "skipped" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SessionExercise_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SessionExercise_workoutSessionId_idx" ON "SessionExercise"("workoutSessionId");

-- CreateIndex
CREATE INDEX "SessionExercise_exerciseId_idx" ON "SessionExercise"("exerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionExercise_workoutSessionId_orderIndex_key" ON "SessionExercise"("workoutSessionId", "orderIndex");

-- AddForeignKey
ALTER TABLE "SessionExercise" ADD CONSTRAINT "SessionExercise_workoutSessionId_fkey" FOREIGN KEY ("workoutSessionId") REFERENCES "WorkoutSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionExercise" ADD CONSTRAINT "SessionExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionExercise" ADD CONSTRAINT "SessionExercise_substitutedForId_fkey" FOREIGN KEY ("substitutedForId") REFERENCES "SessionExercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionSet" ADD CONSTRAINT "SessionSet_sessionExerciseId_fkey" FOREIGN KEY ("sessionExerciseId") REFERENCES "SessionExercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;
