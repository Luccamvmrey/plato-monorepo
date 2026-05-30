import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { WorkoutSessionService } from "@/features/workouts/services/workout-session/workout-session.service";
import { PersonalRecordService } from "@/features/workouts/services/personal-record.service";
import { calculateE1RM, calculateSetVolume } from "@/features/workouts/utils/analytics";
import { path } from "@/core/constants/path";

interface GroupedData {
    date: Date;
    maxE1RM: number;
    totalVolume: number;
    sets: { date: Date; weight: number; reps: number; rpe: number; e1rm: number; volume: number }[];
}

export const useExerciseAnalytics = (exerciseId: number) => {
    const [, navigate] = useLocation();

    const { data: sessions, isLoading: sessionsLoading } = useQuery({
        queryKey: ["sessions", "exercise", exerciseId],
        queryFn: () => WorkoutSessionService.getByExerciseId(exerciseId)
    });

    const { data: records, isLoading: recordsLoading } = useQuery({
        queryKey: ["records", exerciseId],
        queryFn: () => PersonalRecordService.getByExerciseId(exerciseId)
    });

    const isLoading = sessionsLoading || recordsLoading;

    // Flat list of all sets (for ExecutionHistoryList), sorted asc
    const exerciseData = sessions?.flatMap(session => {
        const date = session.completedAt ? new Date(session.completedAt) : new Date(session.startedAt);
        const sessionNote = session.sessionSet[0]?.userObservation ?? undefined;
        return session.sessionSet.map(set => ({
            date,
            weight: set.actualWeight,
            reps: set.actualReps,
            rpe: set.rpe,
            e1rm: calculateE1RM(set.actualWeight, set.actualReps, set.rpe, set.equipmentWeight || 0),
            volume: calculateSetVolume(set.actualWeight, set.actualReps, set.equipmentWeight || 0),
            note: sessionNote,
        }));
    }).sort((a, b) => a.date.getTime() - b.date.getTime()) ?? [];

    // One data point per session (not per day) — fixes grouping bug
    const chartData: GroupedData[] = (sessions ?? [])
        .filter(session => session.sessionSet.length > 0)
        .map(session => {
            const date = session.completedAt ? new Date(session.completedAt) : new Date(session.startedAt);
            const sets = session.sessionSet.map(set => ({
                date,
                weight: set.actualWeight,
                reps: set.actualReps,
                rpe: set.rpe,
                e1rm: calculateE1RM(set.actualWeight, set.actualReps, set.rpe, set.equipmentWeight || 0),
                volume: calculateSetVolume(set.actualWeight, set.actualReps, set.equipmentWeight || 0)
            }));
            return {
                date,
                maxE1RM: Math.max(...sets.map(s => s.e1rm)),
                totalVolume: sets.reduce((sum, s) => sum + s.volume, 0),
                sets
            };
        })
        .sort((a, b) => a.date.getTime() - b.date.getTime());

    const exerciseInfo = sessions?.[0]?.sessionSet?.[0]?.exercise;

    const maxE1RM = Math.max(...chartData.map(d => d.maxE1RM), 0);
    const maxVolume = Math.max(...chartData.map(d => d.totalVolume), 0);

    const goBack = () => navigate(path.HISTORY);

    return { isLoading, exerciseInfo, records, chartData, exerciseData, maxE1RM, maxVolume, goBack };
};
