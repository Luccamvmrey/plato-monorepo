import { calculateSessionSummary } from "@/features/workouts/utils/analytics";
import type { WorkoutSession } from "@/features/workouts/workout.types";
import type { MuscleGroup } from "@plato/database/generated/prisma/enums";
import { path } from "@/core/constants/path";

export const useSessionHistoryCardLogic = (
    session: WorkoutSession,
    allRecords: { exerciseId: number; date: string | Date }[] | undefined,
    navigate: (path: string) => void
) => {
    const workoutName = session.workout?.name || "Treino Avulso";
    const isArchived = session.workout && !session.workout.isActive;

    const summary = calculateSessionSummary(session);
    const { totalVolume, avgRpe, duration, totalSets, exerciseCount } = summary;
    
    const completedAt = session.completedAt ? new Date(session.completedAt) : null;

    const uniqueExerciseIds = Array.from(new Set(session.sessionSet.map(s => s.exerciseId)));

    const exercises = uniqueExerciseIds.map(exId => {
        const set = session.sessionSet.find((s) => s.exerciseId === exId);
        const exercise = set?.exercise;
        const hasPr =
            allRecords?.some((r) => {
                if (r.exerciseId !== exId || !completedAt) return false;
                const recordDate = new Date(r.date).toISOString().slice(0, 10);
                const sessionDate = completedAt.toISOString().slice(0, 10);
                return recordDate === sessionDate;
            }) ?? false;
        return {
            id: exId,
            name: exercise?.name || "Exercício Removido",
            muscleGroup: exercise?.targetMuscle as MuscleGroup | undefined,
            hasPr,
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
        handleExerciseClick,
    };
};
