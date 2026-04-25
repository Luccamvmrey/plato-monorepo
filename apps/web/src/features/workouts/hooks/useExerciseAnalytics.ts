import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { WorkoutSessionService } from "@/features/workouts/services/workout-session/workout-session.service";
import { PersonalRecordService } from "@/features/workouts/services/personal-record.service";
import { calculateE1RM, calculateSetVolume } from "@/features/workouts/utils/analytics";
import { format } from "date-fns";
import { path } from "@/core/constants/path";

interface GroupedData {
    date: Date;
    maxE1RM: number;
    totalVolume: number;
    sets: any[];
}

export const useExerciseAnalytics = (exerciseId: number) => {
    const [_, navigate] = useLocation();

    const { data: sessions, isLoading: sessionsLoading } = useQuery({
        queryKey: ["sessions"],
        queryFn: () => WorkoutSessionService.getByUserId()
    });

    const { data: records, isLoading: recordsLoading } = useQuery({
        queryKey: ["records", exerciseId],
        queryFn: () => PersonalRecordService.getByExerciseId(exerciseId)
    });

    const isLoading = sessionsLoading || recordsLoading;

    // Extract stats for this specific exercise
    const exerciseData = sessions?.flatMap(session => 
        (session as any).sessionSet
            .filter((set: any) => set.exerciseId === exerciseId)
            .map((set: any) => ({
                date: session.completedAt ? new Date(session.completedAt) : new Date(session.startedAt),
                weight: set.actualWeight,
                reps: set.actualReps,
                rpe: set.rpe,
                e1rm: calculateE1RM(set.actualWeight, set.actualReps, set.rpe, set.equipmentWeight || 0),
                volume: calculateSetVolume(set.actualWeight, set.actualReps, set.equipmentWeight || 0)
            }))
    ).sort((a, b) => a.date.getTime() - b.date.getTime()) || [];

    // Group by date to get max e1RM and total volume per session
    const sessionsGrouped = exerciseData.reduce((acc, curr) => {
        const dateKey = format(curr.date, "yyyy-MM-dd");
        if (!acc[dateKey]) {
            acc[dateKey] = { date: curr.date, maxE1RM: 0, totalVolume: 0, sets: [] };
        }
        acc[dateKey].maxE1RM = Math.max(acc[dateKey].maxE1RM, curr.e1rm);
        acc[dateKey].totalVolume += curr.volume;
        acc[dateKey].sets.push(curr);
        return acc;
    }, {} as Record<string, GroupedData>);

    const chartData: GroupedData[] = Object.values(sessionsGrouped);

    const exerciseInfo = sessions?.flatMap(s => (s as any).sessionSet).find(s => s.exerciseId === exerciseId)?.exercise;

    const maxE1RM = Math.max(...chartData.map(d => d.maxE1RM), 0);
    const maxVolume = Math.max(...chartData.map(d => d.totalVolume), 0);

    const goBack = () => navigate(path.HISTORY);

    return {
        isLoading,
        exerciseInfo,
        records,
        chartData,
        exerciseData,
        maxE1RM,
        maxVolume,
        goBack
    };
};
