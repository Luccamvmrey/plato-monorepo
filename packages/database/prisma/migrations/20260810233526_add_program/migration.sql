-- AlterTable
ALTER TABLE "WorkoutSession" ADD COLUMN     "programId" INTEGER;

-- CreateTable
CREATE TABLE "Program" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramWorkout" (
    "id" SERIAL NOT NULL,
    "programId" INTEGER NOT NULL,
    "workoutId" INTEGER NOT NULL,
    "orderIndex" INTEGER NOT NULL,

    CONSTRAINT "ProgramWorkout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Program_userId_idx" ON "Program"("userId");

-- CreateIndex
CREATE INDEX "ProgramWorkout_workoutId_idx" ON "ProgramWorkout"("workoutId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramWorkout_programId_orderIndex_key" ON "ProgramWorkout"("programId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramWorkout_programId_workoutId_key" ON "ProgramWorkout"("programId", "workoutId");

-- CreateIndex
CREATE INDEX "WorkoutSession_userId_programId_completedAt_idx" ON "WorkoutSession"("userId", "programId", "completedAt");

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramWorkout" ADD CONSTRAINT "ProgramWorkout_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramWorkout" ADD CONSTRAINT "ProgramWorkout_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------------------------------------------------------
-- Escrito à mão: o Prisma não expressa índice único PARCIAL no schema.prisma.
-- Sem isto, duas requisições concorrentes de `PATCH /programs/:id/activate`
-- deixam dois programas ativos e `GET /programs/active/next` vira
-- não-determinístico. A transação no service é a primeira linha de defesa; este
-- índice é a garantia.
-- ----------------------------------------------------------------------------
CREATE UNIQUE INDEX "program_one_active_per_user" ON "Program" ("userId") WHERE "isActive";
