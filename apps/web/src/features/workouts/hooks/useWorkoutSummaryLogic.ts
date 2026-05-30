import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useActiveWorkoutStore } from "@/features/workouts/stores/active-workout.store";
import { WorkoutSessionService } from "@/features/workouts/services/workout-session/workout-session.service";
import { WorkoutService } from "@/features/workouts/services/workout.service";
import { useWorkoutSummaryStats } from "@/features/workouts/hooks/useWorkoutSummaryStats";
import { path } from "@/core/constants/path";

export const useWorkoutSummaryLogic = () => {
    const navigate = useLocation()[1];
    const { id: sessionIdStr } = useParams();
    const sessionId = sessionIdStr ? parseInt(sessionIdStr) : null;
    const clearState = useActiveWorkoutStore(state => state.clearState);

    const sessionQuery = useQuery({
        queryKey: ["workoutSession", sessionId],
        queryFn: () => WorkoutSessionService.getById(sessionId!),
        enabled: !!sessionId,
    });

    const workoutSession = sessionQuery.data;

    const workoutQuery = useQuery({
        queryKey: ["workout", workoutSession?.workoutId?.toString()],
        queryFn: () => WorkoutService.getById(workoutSession!.workoutId.toString()),
        enabled: !!workoutSession,
    });

    const workout = workoutQuery.data;

    const lastSessionQuery = useQuery({
        queryKey: ["sessions"],
        queryFn: () => WorkoutSessionService.getByUserId(),
        enabled: !!workoutSession,
        select: (sessions) =>
            sessions.find(s =>
                s.workoutId === workoutSession!.workoutId &&
                s.id !== workoutSession!.id &&
                !!s.completedAt &&
                new Date(s.completedAt) < new Date(workoutSession!.completedAt!)
            ) ?? null,
    });

    const lastSession = lastSessionQuery.data ?? null;
    const stats = useWorkoutSummaryStats(workoutSession, workout, lastSession);

    const handleFinish = () => {
        clearState();
        navigate(path.WORKOUTS);
    };

    const isLoading = sessionQuery.isLoading || workoutQuery.isLoading || lastSessionQuery.isLoading;

    return {
        navigate,
        workoutSession,
        workout,
        stats,
        handleFinish,
        isLoading,
    };
};
