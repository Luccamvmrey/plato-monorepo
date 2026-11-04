import type { RpeSet, SummarizableSession, TrainingSet } from "./types";
import { calculateTotalVolume } from "./volume";

/** RPE médio das séries com RPE informado. Sem nenhuma, devolve 0. */
export const calculateAverageRPE = (sets: readonly RpeSet[]): number => {
    const known = sets.flatMap((set) => (set.rpe === null ? [] : [set.rpe]));

    if (known.length === 0) return 0;

    return known.reduce((total, rpe) => total + rpe, 0) / known.length;
};

/** Duração da sessão em segundos. Sessão sem início ou sem fim devolve 0. */
export const calculateSessionDuration = (
    session: Pick<SummarizableSession, "startedAt" | "completedAt">
): number => {
    if (!session.startedAt || !session.completedAt) return 0;

    return Math.round(
        (new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 1000
    );
};

/** Métricas básicas de uma sessão. */
export const calculateSessionSummary = (session: SummarizableSession) => {
    const sets: TrainingSet[] = session.sessionSet ?? [];

    return {
        totalVolume: calculateTotalVolume(sets),
        avgRpe: calculateAverageRPE(sets),
        duration: calculateSessionDuration(session),
        totalSets: sets.length,
        exerciseCount: new Set(sets.map(set => set.exerciseId)).size,
    };
};
