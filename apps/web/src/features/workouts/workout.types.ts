import type {
    ExerciseModel as PrismaExercise,
    WorkoutModel as PrismaWorkout,
    WorkoutExerciseModel as PrismaWorkoutExercise,
    WorkoutSessionModel as PrismaWorkoutSession,
    SessionSetModel as PrismaSessionSet,
    SessionExerciseModel as PrismaSessionExercise
} from "@plato/database/generated/prisma/models";
import type { GroupMembership } from "@plato/shared";

export type Exercise = PrismaExercise;

export type SessionExerciseOrigin = PrismaSessionExercise["origin"];

/** Motivo da sugestão, em código. O rótulo vive em `utils/movement.ts`. */
export type AlternativeReason =
    | "SAME_PATTERN_SAME_EQUIPMENT"
    | "SAME_PATTERN_OTHER_EQUIPMENT"
    | "SAME_PATTERN_OTHER_MUSCLE"
    | "SAME_MUSCLE_OTHER_PATTERN";

export interface ExerciseAlternative extends Exercise {
    reason: AlternativeReason;
    /** Séries que o usuário já registrou neste exercício. Desempata o ranking. */
    recordedSets: number;
}

/** Resposta de `GET /exercises/:id/alternatives`. */
export interface ExerciseAlternatives {
    target: Exercise;
    alternatives: ExerciseAlternative[];
}

export interface WorkoutExercise extends PrismaWorkoutExercise {
    exercise?: Exercise;
}

export interface Workout extends PrismaWorkout {
    workoutExercise: WorkoutExercise[];
}

export interface SessionSet extends PrismaSessionSet {
    exercise?: Exercise;
}

export interface SessionExercise extends PrismaSessionExercise {
    exercise: Exercise;
}

export interface WorkoutSession extends PrismaWorkoutSession {
    sessionSet: SessionSet[];
    /**
     * Só vem nos caminhos da sessão ATIVA, e só existe em sessões iniciadas depois do
     * snapshot. Ausente ou vazio = sessão legada, que a pilha resolve pelo plano vivo.
     */
    sessionExercise?: SessionExercise[];
    workout?: Pick<PrismaWorkout, 'name' | 'isActive'>;
}

export interface WorkoutSessionWithWorkout extends WorkoutSession {
    workout: PrismaWorkout;
}

export type ExerciseStatus = "COMPLETED" | "ACTIVE" | "PENDING" | "SKIPPED" | "REPLACED";

/**
 * Uma linha da pilha da sessão ativa.
 *
 * Deixou de estender `WorkoutExercise` porque a fonte passou a ser o snapshot
 * (`SessionExercise`) — o plano vivo só é usado em sessão legada. Nenhum consumidor
 * usava o `id` do WorkoutExercise; a identidade sempre foi `exerciseId`.
 */
export interface EnrichedExerciseRecord {
    /** Identidade estável da linha, para keys de lista. */
    key: string;
    /**
     * `null` em sessão legada. É o que habilita trocar, pular e remover: sem snapshot
     * não há o que referenciar no servidor.
     */
    sessionExerciseId: number | null;
    exerciseId: number;
    exercise: Exercise;
    orderIndex: number;
    targetSets: number;
    targetReps: number;
    observation: string | null;
    origin: SessionExerciseOrigin | null;
    skipped: boolean;
    /** Nome do exercício que tomou o lugar deste, quando houve troca. */
    replacedByName: string | null;
    /** Nome do exercício que este substituiu. */
    substitutedForName: string | null;
    /** Agrupamento prescrito, vindo do snapshot. */
    groupKey: string | null;
    groupType: string | null;
    /**
     * Posição no grupo, recalculada sobre a ordem FINAL da pilha — depois da
     * reordenação da sessão e do reposicionamento dos substitutos. Se um desses
     * quebrou a contiguidade, o grupo deixa de existir na tela, que é o correto:
     * bi-set que não está mais lado a lado não é bi-set.
     */
    group: GroupMembership | null;
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
