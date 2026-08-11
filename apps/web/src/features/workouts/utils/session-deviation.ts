import type { WorkoutSession } from "@/features/workouts/workout.types.ts";

export type DeviationKind = "AD_HOC" | "SUBSTITUTED" | "SKIPPED" | "REPLACED" | "NOT_DONE";

export interface ExerciseDeviation {
    kind: DeviationKind;
    /** Só para SUBSTITUTED: o exercício que este tomou o lugar. */
    replacedName?: string;
}

export interface UnexecutedExercise {
    exerciseId: number;
    name: string;
    kind: Extract<DeviationKind, "SKIPPED" | "REPLACED" | "NOT_DONE">;
    /** Só para REPLACED: quem entrou no lugar. */
    replacedByName?: string;
}

export interface SessionDeviations {
    /** Marcação por exercício EXECUTADO. Ausente = veio do plano, sem desvio. */
    byExerciseId: Map<number, ExerciseDeviation>;
    /** Prescrito que não gerou série nenhuma, com o motivo. */
    unexecuted: UnexecutedExercise[];
    /** Sessão legada (sem snapshot): não há o que afirmar sobre desvio. */
    isLegacy: boolean;
}

export const DEVIATION_LABEL: Record<DeviationKind, string> = {
    AD_HOC:      "Adicionado",
    SUBSTITUTED: "Substituiu",
    SKIPPED:     "Pulado",
    REPLACED:    "Trocado",
    NOT_DONE:    "Não realizado",
};

const EMPTY: SessionDeviations = { byExerciseId: new Map(), unexecuted: [], isLegacy: true };

/**
 * O que a sessão teve de diferente do plano, derivado do snapshot.
 *
 * O caso que só existe por causa do snapshot é o `NOT_DONE`: um exercício prescrito e
 * não executado não tem série nenhuma, então uma lista derivada de `sessionSet` — que
 * é como Histórico e Resumo sempre montaram suas listas — nunca soube que ele existiu.
 * Distinguir isso de "o treino foi editado depois" é a razão de o snapshot existir.
 *
 * Sessão legada devolve vazio e `isLegacy`, para a UI não afirmar o que não sabe.
 */
export const buildSessionDeviations = (session: WorkoutSession): SessionDeviations => {
    const snapshot = session.sessionExercise ?? [];

    if (snapshot.length === 0) return EMPTY;

    const nameBySessionExerciseId = new Map(snapshot.map((entry) => [entry.id, entry.exercise.name]));
    const replacedByName = new Map<number, string>();
    for (const entry of snapshot) {
        if (entry.substitutedForId !== null) {
            replacedByName.set(entry.substitutedForId, entry.exercise.name);
        }
    }

    // Quem tem série é decidido pelo vínculo, não pelo exerciseId: com adição ad-hoc o
    // mesmo exercício pode aparecer duas vezes no snapshot.
    const executed = new Set(
        (session.sessionSet ?? [])
            .map((set) => set.sessionExerciseId)
            .filter((id): id is number => id !== null && id !== undefined)
    );

    const byExerciseId = new Map<number, ExerciseDeviation>();
    const unexecuted: UnexecutedExercise[] = [];

    for (const entry of snapshot) {
        if (!executed.has(entry.id)) {
            const replacement = replacedByName.get(entry.id);

            unexecuted.push({
                exerciseId: entry.exerciseId,
                name:       entry.exercise.name,
                kind:       entry.skipped ? "SKIPPED" : replacement ? "REPLACED" : "NOT_DONE",
                ...(replacement ? { replacedByName: replacement } : {}),
            });
            continue;
        }

        if (entry.origin === "AD_HOC") {
            byExerciseId.set(entry.exerciseId, { kind: "AD_HOC" });
        } else if (entry.origin === "SUBSTITUTED") {
            byExerciseId.set(entry.exerciseId, {
                kind: "SUBSTITUTED",
                replacedName: entry.substitutedForId !== null
                    ? nameBySessionExerciseId.get(entry.substitutedForId)
                    : undefined,
            });
        }
    }

    return { byExerciseId, unexecuted, isLegacy: false };
};
