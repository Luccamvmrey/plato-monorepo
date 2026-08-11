import { calculateSessionSummary } from "@/features/workouts/utils/analytics";
import { buildSessionDeviations } from "@/features/workouts/utils/session-deviation";
import type { WorkoutSession } from "@/features/workouts/workout.types";
import type { MuscleGroup } from "@plato/database/generated/prisma/enums";
import { path } from "@/core/constants/path";

export const useSessionHistoryCardLogic = (
    session: WorkoutSession,
    sessionPrMap: Map<number, Set<number>>,
    navigate: (path: string) => void
) => {
    const workoutName = session.workout?.name || "Treino Avulso";
    const isArchived = session.workout && !session.workout.isActive;

    const summary = calculateSessionSummary(session);
    const { totalVolume, avgRpe, duration, totalSets, exerciseCount } = summary;

    const completedAt = session.completedAt ? new Date(session.completedAt) : null;

    const uniqueExerciseIds = Array.from(new Set(session.sessionSet.map(s => s.exerciseId)));

    const prExercises = sessionPrMap.get(session.id);

    const deviations = buildSessionDeviations(session);

    const exercises = uniqueExerciseIds.map(exId => {
        const set = session.sessionSet.find((s) => s.exerciseId === exId);
        const exercise = set?.exercise;
        const rawNote = session.sessionSet.find(s => s.exerciseId === exId)?.userObservation;
        return {
            id: exId,
            name: exercise?.name || "Exercício Removido",
            muscleGroup: exercise?.targetMuscle as MuscleGroup | undefined,
            hasPr: prExercises?.has(exId) ?? false,
            note: rawNote ?? undefined,
            deviation: deviations.byExerciseId.get(exId),
        };
    });

    const handleExerciseClick = (exId: number) => {
        navigate(`${path.EXERCISE_ANALYTICS}/${exId}`);
    };

    return {
        workoutName,
        isArchived,
        totalVolume,
        avgRpe,
        completedAt,
        duration,
        totalSets,
        exerciseCount,
        exercises,
        unexecuted: deviations.unexecuted,
        handleExerciseClick,
    };
};
