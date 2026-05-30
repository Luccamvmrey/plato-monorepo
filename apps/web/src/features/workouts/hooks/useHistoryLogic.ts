import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { WorkoutSessionService } from "@/features/workouts/services/workout-session/workout-session.service";
import { useWorkouts } from "@/features/workouts/hooks/useWorkouts";
import { useLocation } from "wouter";
import type { WorkoutSession } from "../workout.types";

const computeSessionPrs = (sessions: WorkoutSession[]): Map<number, Set<number>> => {
    const result = new Map<number, Set<number>>();

    const completed = sessions
        .filter(s => s.completedAt)
        .sort((a, b) => new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime());

    const runningBestWeight: Record<number, number> = {};
    const runningBestVolume: Record<number, number> = {};

    for (const session of completed) {
        const prExercises = new Set<number>();
        const sessionBestWeight: Record<number, number> = {};
        const sessionTotalVolume: Record<number, number> = {};

        for (const set of session.sessionSet) {
            const exId = set.exerciseId;
            sessionBestWeight[exId] = Math.max(sessionBestWeight[exId] ?? 0, set.actualWeight);
            sessionTotalVolume[exId] = (sessionTotalVolume[exId] ?? 0) + set.actualWeight * set.actualReps;
        }

        for (const exId of Object.keys(sessionBestWeight).map(Number)) {
            const prevWeight = runningBestWeight[exId] ?? 0;
            const prevVolume = runningBestVolume[exId] ?? 0;
            if (sessionBestWeight[exId] > prevWeight || sessionTotalVolume[exId] > prevVolume) {
                prExercises.add(exId);
            }
            runningBestWeight[exId] = Math.max(prevWeight, sessionBestWeight[exId]);
            runningBestVolume[exId] = Math.max(prevVolume, sessionTotalVolume[exId]);
        }

        result.set(session.id, prExercises);
    }

    return result;
};

export const useHistoryLogic = () => {
    const [, navigate] = useLocation();
    const [selectedFilter, setSelectedFilter] = useState<string>("all");

    const { data: sessions, isLoading: sessionsLoading } = useQuery({
        queryKey: ["sessions"],
        queryFn: () => WorkoutSessionService.getByUserId()
    });

    const { userWorkoutsQuery } = useWorkouts();
    const { data: workouts } = userWorkoutsQuery;

    const isLoading = sessionsLoading;

    const filteredSessions = sessions?.filter(session => {
        if (selectedFilter === "all") {
            return session.workout?.isActive !== false;
        }
        return session.workoutId === Number(selectedFilter);
    });

    const sessionPrMap = useMemo(() => computeSessionPrs(sessions ?? []), [sessions]);

    return {
        selectedFilter,
        setSelectedFilter,
        sessions,
        workouts,
        isLoading,
        filteredSessions,
        sessionPrMap,
        navigate
    };
};
