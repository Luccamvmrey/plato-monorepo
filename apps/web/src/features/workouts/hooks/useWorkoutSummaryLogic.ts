import { useLocation, useParams } from "wouter";
import { useMemo } from "react";
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
        queryKey: ["workout", workoutSession?.workoutId],
        queryFn: () => WorkoutService.getById(workoutSession!.workoutId.toString()),
        enabled: !!workoutSession,
    });

    const workout = workoutQuery.data;

    const historyQuery = useQuery({
        queryKey: ["workoutHistory", workoutSession?.workoutId],
        queryFn: () => WorkoutSessionService.getByWorkoutId(workoutSession!.workoutId.toString()),
        enabled: !!workoutSession,
    });

    const lastSession = useMemo(() => {
        if (!historyQuery.data || !workoutSession) return null;
        
        return historyQuery.data.find(s => 
            s.id !== workoutSession.id && 
            new Date(s.completedAt!) < new Date(workoutSession.completedAt!)
        );
    }, [historyQuery.data, workoutSession]);
    
    const stats = useWorkoutSummaryStats(workoutSession, workout, lastSession);

    const handleFinish = () => {
        clearState();
        navigate(path.WORKOUTS);
    };

    const isLoading = sessionQuery.isLoading || workoutQuery.isLoading || historyQuery.isLoading;

    return {
        navigate,
        workoutSession,
        workout,
        stats,
        handleFinish,
        isLoading,
    };
};
