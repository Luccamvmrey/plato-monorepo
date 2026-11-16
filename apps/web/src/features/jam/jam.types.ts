export type { JamMemberState, JamState } from "@plato/shared";

/** O que a tela de entrada mostra antes do login. */
export interface JamPreview {
    workoutName: string;
    exerciseCount: number;
    hostName: string;
    memberCount: number;
    maxMembers: number;
    isFull: boolean;
    isEnded: boolean;
}

/** Treino da própria pessoa que serve para a jam, do mais provável para o menos. */
export interface JamWorkoutCandidate {
    id: number;
    name: string;
    isActive: boolean;
}

export interface CreateJamResult {
    jamId: number;
    token: string;
    sessionId: number;
    workoutId: number;
}

export interface JoinJamResult {
    jamId: number;
    sessionId: number;
    workoutId: number;
    entryExerciseId: number | null;
}
