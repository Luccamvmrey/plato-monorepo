import type { JamMemberProgress } from "@plato/shared";

/** "Supino · 2/4", "Terminou" ou "Parado", como a sheet mostra cada pessoa. */
export const describeJamProgress = (progress: JamMemberProgress): string => {
    if (progress.kind === "DONE") return "Terminou";
    if (progress.kind === "IDLE") return "Parado";

    return `${progress.exerciseName} · ${progress.setsDone}/${progress.targetSets}`;
};
