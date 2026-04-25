import { calculateTotalVolume, calculateAverageRPE } from "@/features/workouts/utils/analytics";
import type { WorkoutSession } from "@/features/workouts/workout.types";
import { format } from "date-fns";
import { path } from "@/core/constants/path";

export const useSessionHistoryCardLogic = (session: WorkoutSession, allRecords: any[] | undefined, navigate: (path: string) => void) => {
    const totalVolume = calculateTotalVolume(session.sessionSet);
    const avgRpe = calculateAverageRPE(session.sessionSet);
    const completedAt = session.completedAt ? new Date(session.completedAt) : null;

    const uniqueExerciseIds = Array.from(new Set(session.sessionSet.map(s => s.exerciseId)));

    const exercises = uniqueExerciseIds.map(exId => {
        const exercise = (session as any).sessionSet.find((s: any) => s.exerciseId === exId)?.exercise;
        const hasPrInThisSession = allRecords?.some(r => 
            r.exerciseId === exId && 
            completedAt && 
            format(new Date(r.date), "yyyy-MM-dd") === format(completedAt, "yyyy-MM-dd")
        );
        return {
            id: exId,
            name: exercise?.name || "Exercício Removido",
            hasPr: hasPrInThisSession
        };
    });

    const handleExerciseClick = (exId: number) => {
        navigate(`${path.EXERCISE_ANALYTICS}/${exId}`);
    };

    return {
        totalVolume,
        avgRpe,
        completedAt,
        exercises,
        handleExerciseClick
    };
};
