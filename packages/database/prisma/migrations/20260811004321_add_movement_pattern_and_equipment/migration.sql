-- Padrão de movimento e equipamento no catálogo. Puramente ADITIVA: as duas colunas
-- nascem NULL nos 117 exercícios e são preenchidas por revisão humana
-- (`prisma/classify-movement.ts`), não por default. Exercício sem classificação
-- simplesmente não participa da sugestão por padrão — nunca é classificado errado.

-- CreateEnum
CREATE TYPE "MovementPattern" AS ENUM ('HORIZONTAL_PUSH', 'VERTICAL_PUSH', 'HORIZONTAL_PULL', 'VERTICAL_PULL', 'SQUAT', 'HIP_HINGE', 'LUNGE', 'ISOLATION', 'CARRY', 'CORE');

-- CreateEnum
CREATE TYPE "Equipment" AS ENUM ('BARBELL', 'DUMBBELL', 'MACHINE', 'CABLE', 'SMITH', 'BODYWEIGHT', 'EZ_BAR', 'KETTLEBELL');

-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "equipment" "Equipment",
ADD COLUMN     "movementPattern" "MovementPattern";
