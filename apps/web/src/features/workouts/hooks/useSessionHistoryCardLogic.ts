import { calculateSessionSummary, externalLoad } from "@/features/workouts/utils/analytics";
import { buildSessionDeviations } from "@/features/workouts/utils/session-deviation";
import { formatWeightPtBr } from "@/features/workouts/utils/progression";
import type { WorkoutSession } from "@/features/workouts/workout.types";
import { path } from "@/core/constants/path";
import { UNITS } from "@/core/constants/units";

export const useSessionHistoryCardLogic = (
    session: WorkoutSession,
    sessionPrMap: Map<number, Set<number>>,
    navigate: (path: string) => void
) => {
    const workoutName = session.workout?.name || "Treino Avulso";
    const isArchived = session.workout && !session.workout.isActive;
    const isSimple = session.trackingMode === "SIMPLE";

    const summary = calculateSessionSummary(session);
    const { totalVolume, avgRpe, duration, totalSets } = summary;

    const completedAt = session.completedAt ? new Date(session.completedAt) : null;

    const uniqueExerciseIds = Array.from(new Set(session.sessionSet.map(s => s.exerciseId)));

    const prExercises = sessionPrMap.get(session.id);

    const deviations = buildSessionDeviations(session);

    const exercises = uniqueExerciseIds.map(exId => {
        const sets = session.sessionSet.filter((s) => s.exerciseId === exId);
        const exercise = sets[0]?.exercise;
        const topLoad = Math.max(...sets.map(externalLoad));

        return {
            id: exId,
            name: exercise?.name || "Exercício Removido",
            // "4 × 71,5 kg" lê como a prescrição que a pessoa conhece. Sem carga
            // (peso corporal, ou peso não informado), fica só a contagem.
            summary: topLoad > 0
                ? `${sets.length} × ${formatWeightPtBr(topLoad)} ${UNITS.WEIGHT}`
                : `${sets.length} ${sets.length === 1 ? UNITS.SINGLE_SET : UNITS.SETS}`,
            hasPr: prExercises?.has(exId) ?? false,
            note: sets[0]?.userObservation ?? undefined,
            deviation: deviations.byExerciseId.get(exId),
        };
    });

    const handleExerciseClick = (exId: number) => {
        navigate(`${path.EXERCISE_ANALYTICS}/${exId}`);
    };

    return {
        workoutName,
        isArchived,
        isSimple,
        totalVolume,
        avgRpe,
        completedAt,
        duration,
        totalSets,
        prCount: exercises.filter((ex) => ex.hasPr).length,
        exercises,
        unexecuted: deviations.unexecuted,
        handleExerciseClick,
    };
};
