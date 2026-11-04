-- CreateEnum
CREATE TYPE "SharedPlanKind" AS ENUM ('WORKOUT', 'PROGRAM');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "signupPlanId" INTEGER;

-- AlterTable
ALTER TABLE "Program" ADD COLUMN     "sourcePlanId" INTEGER;

-- AlterTable
ALTER TABLE "Workout" ADD COLUMN     "sourcePlanId" INTEGER;

-- CreateTable
CREATE TABLE "SharedPlan" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "kind" "SharedPlanKind" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "userId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "curatedKey" TEXT,
    "featuredOrder" INTEGER,
    "focusLabel" TEXT,
    "sessionsPerWeek" INTEGER,

    CONSTRAINT "SharedPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedPlanWorkout" (
    "id" SERIAL NOT NULL,
    "planId" INTEGER NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "SharedPlanWorkout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedPlanExercise" (
    "id" SERIAL NOT NULL,
    "planWorkoutId" INTEGER NOT NULL,
    "exerciseId" INTEGER NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "targetSets" INTEGER NOT NULL,
    "targetReps" INTEGER NOT NULL,
    "observation" TEXT,
    "groupKey" TEXT,
    "groupType" "ExerciseGroupType",

    CONSTRAINT "SharedPlanExercise_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SharedPlan_token_key" ON "SharedPlan"("token");

-- CreateIndex
CREATE UNIQUE INDEX "SharedPlan_curatedKey_key" ON "SharedPlan"("curatedKey");

-- CreateIndex
CREATE INDEX "SharedPlan_userId_idx" ON "SharedPlan"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SharedPlanWorkout_planId_orderIndex_key" ON "SharedPlanWorkout"("planId", "orderIndex");

-- CreateIndex
CREATE INDEX "SharedPlanExercise_planWorkoutId_idx" ON "SharedPlanExercise"("planWorkoutId");

-- CreateIndex
CREATE INDEX "SharedPlanExercise_exerciseId_idx" ON "SharedPlanExercise"("exerciseId");

-- CreateIndex
CREATE INDEX "Program_sourcePlanId_idx" ON "Program"("sourcePlanId");

-- CreateIndex
CREATE INDEX "Workout_sourcePlanId_idx" ON "Workout"("sourcePlanId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_signupPlanId_fkey" FOREIGN KEY ("signupPlanId") REFERENCES "SharedPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_sourcePlanId_fkey" FOREIGN KEY ("sourcePlanId") REFERENCES "SharedPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workout" ADD CONSTRAINT "Workout_sourcePlanId_fkey" FOREIGN KEY ("sourcePlanId") REFERENCES "SharedPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedPlan" ADD CONSTRAINT "SharedPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedPlanWorkout" ADD CONSTRAINT "SharedPlanWorkout_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SharedPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedPlanExercise" ADD CONSTRAINT "SharedPlanExercise_planWorkoutId_fkey" FOREIGN KEY ("planWorkoutId") REFERENCES "SharedPlanWorkout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedPlanExercise" ADD CONSTRAINT "SharedPlanExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

