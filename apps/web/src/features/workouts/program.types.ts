import type {
    ProgramModel as PrismaProgram,
    ProgramWorkoutModel as PrismaProgramWorkout,
} from "@plato/database/generated/prisma/models";
import type { Workout } from "@/features/workouts/workout.types.ts";

export type Program = PrismaProgram;

export interface ProgramWorkout extends PrismaProgramWorkout {
    workout: Workout;
}

export interface ProgramWithWorkouts extends Program {
    programWorkout: ProgramWorkout[];
}

/**
 * Uma posição do ciclo, como devolvida por `GET /programs/active/next`.
 *
 * `lastCompletedAt` NÃO é escopado ao programa de propósito (o servidor não filtra
 * por programId nessa conta): a pergunta é "quando foi a última vez que fiz este
 * treino", e uma sessão avulsa do mesmo treino conta para respondê-la.
 */
export interface ProgramCycleEntry {
    workoutId: number;
    name: string;
    position: number;
    isNext: boolean;
    lastCompletedAt: string | null;
}

/** Resposta de `GET /programs/active/next`. `null` quando não há programa ativo. */
export interface ActiveProgramNext {
    program: Pick<Program, "id" | "name" | "description" | "isActive">;
    next: ProgramWorkout | null;
    position: number | null;
    total: number;
    lastCompleted: {
        sessionId: number;
        workoutId: number;
        completedAt: string;
    } | null;
    cycle: ProgramCycleEntry[];
}
