-- CreateEnum
CREATE TYPE "JamExerciseMode" AS ENUM ('PARALLEL', 'ALTERNATE');

-- AlterTable
ALTER TABLE "WorkoutSession" ADD COLUMN     "jamId" INTEGER;

-- CreateTable
CREATE TABLE "Jam" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "hostUserId" INTEGER NOT NULL,
    "sharedPlanId" INTEGER NOT NULL,
    "hostWorkoutId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "exerciseModes" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "Jam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JamMember" (
    "id" SERIAL NOT NULL,
    "jamId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "presence" JSONB,

    CONSTRAINT "JamMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Jam_token_key" ON "Jam"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Jam_sharedPlanId_key" ON "Jam"("sharedPlanId");

-- CreateIndex
CREATE INDEX "Jam_hostWorkoutId_idx" ON "Jam"("hostWorkoutId");

-- CreateIndex
CREATE INDEX "JamMember_userId_idx" ON "JamMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "JamMember_jamId_userId_key" ON "JamMember"("jamId", "userId");

-- CreateIndex
CREATE INDEX "WorkoutSession_jamId_idx" ON "WorkoutSession"("jamId");

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_jamId_fkey" FOREIGN KEY ("jamId") REFERENCES "Jam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jam" ADD CONSTRAINT "Jam_hostUserId_fkey" FOREIGN KEY ("hostUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jam" ADD CONSTRAINT "Jam_sharedPlanId_fkey" FOREIGN KEY ("sharedPlanId") REFERENCES "SharedPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jam" ADD CONSTRAINT "Jam_hostWorkoutId_fkey" FOREIGN KEY ("hostWorkoutId") REFERENCES "Workout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JamMember" ADD CONSTRAINT "JamMember_jamId_fkey" FOREIGN KEY ("jamId") REFERENCES "Jam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JamMember" ADD CONSTRAINT "JamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

