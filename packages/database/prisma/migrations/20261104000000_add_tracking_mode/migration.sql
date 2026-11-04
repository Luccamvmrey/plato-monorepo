-- CreateEnum
CREATE TYPE "TrackingMode" AS ENUM ('FULL', 'SIMPLE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "trackingMode" "TrackingMode" NOT NULL DEFAULT 'FULL',
ADD COLUMN     "trackingModeChosenAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "WorkoutSession" ADD COLUMN     "trackingMode" "TrackingMode" NOT NULL DEFAULT 'FULL';

-- AlterTable
ALTER TABLE "SessionSet" ALTER COLUMN "actualWeight" DROP NOT NULL,
ALTER COLUMN "rpe" DROP NOT NULL;
