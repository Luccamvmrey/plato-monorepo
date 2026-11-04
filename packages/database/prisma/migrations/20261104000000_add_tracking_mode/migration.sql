-- CreateEnum
CREATE TYPE "TrackingMode" AS ENUM ('FULL', 'SIMPLE');

-- AlterTable
ALTER TABLE "Workout" ADD COLUMN     "trackingMode" "TrackingMode" NOT NULL DEFAULT 'FULL';

-- AlterTable
ALTER TABLE "WorkoutSession" ADD COLUMN     "trackingMode" "TrackingMode" NOT NULL DEFAULT 'FULL';

-- AlterTable
ALTER TABLE "SessionSet" ALTER COLUMN "actualWeight" DROP NOT NULL,
ALTER COLUMN "rpe" DROP NOT NULL;
