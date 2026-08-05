import type { 
    ExerciseModel as PrismaExercise, 
    WorkoutModel as PrismaWorkout, 
    WorkoutExerciseModel as PrismaWorkoutExercise, 
    WorkoutSessionModel as PrismaWorkoutSession, 
    SessionSetModel as PrismaSessionSet 
} from "@plato/database/generated/prisma/models";

export type Exercise = PrismaExercise;

export interface WorkoutExercise extends PrismaWorkoutExercise {
    exercise?: Exercise;
}

export interface Workout extends PrismaWorkout {
    workoutExercise: WorkoutExercise[];
}

export interface SessionSet extends PrismaSessionSet {
    exercise?: Exercise;
}

export interface WorkoutSession extends PrismaWorkoutSession {
    sessionSet: SessionSet[];
    workout?: Pick<PrismaWorkout, 'name' | 'isActive'>;
}

export interface WorkoutSessionWithWorkout extends WorkoutSession {
    workout: PrismaWorkout;
}

export type ExerciseStatus = "COMPLETED" | "ACTIVE" | "PENDING";

export interface EnrichedExerciseRecord extends WorkoutExercise {
    exercise: Exercise;
    logs: SessionSet[];
    status: ExerciseStatus;
    effectiveTargetSets: number;
}

export type GetUserWorkoutsResponse = Array<Workout>;

export interface SessionSetPayload {
  workoutSessionId: number
  exerciseId: number
  setNumber: number
  actualReps: number
  actualWeight: number
  equipmentWeight?: number
  rpe: number
  userObservation?: string
}

export interface FinishSessionPayload {
  sets: SessionSetPayload[]
}

/**
 * Histórico cru entregue por GET /sessions/workout/:id/exercise-history.
 * Escopado ao treino: o mesmo exercício em dois treinos progride separadamente.
 */
export interface ExerciseExecutionSet {
  setNumber: number
  actualReps: number
  actualWeight: number
  equipmentWeight: number | null
  rpe: number
}

export interface ExerciseExecution {
  sessionId: number
  completedAt: string
  sets: ExerciseExecutionSet[]
}

/** Cada lista vem do mais recente para o mais antigo. */
export type ExerciseHistoryMap = Record<number, ExerciseExecution[]>;
