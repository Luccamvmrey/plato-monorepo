import type { JamMemberProgress } from "@plato/shared";

/** "Supino · 2/4", "Terminou" ou "Parado": o mesmo texto na faixa e na sheet. */
export const describeJamProgress = (progress: JamMemberProgress, myExerciseId: number | null = null): string => {
    if (progress.kind === "DONE") return "Terminou";
    if (progress.kind === "IDLE") return "Parado";

    // No mesmo exercício que você, o nome só repetiria o que está no card logo abaixo.
    if (progress.exerciseId === myExerciseId) {
        return `${progress.setsDone} de ${progress.targetSets} ${progress.targetSets === 1 ? "série" : "séries"}`;
    }

    return `${progress.exerciseName} · ${progress.setsDone}/${progress.targetSets}`;
};
