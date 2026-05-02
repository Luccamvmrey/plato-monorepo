import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { WorkoutSessionService } from "../services/workout-session/workout-session.service";
import { SessionSetService } from "../services/workout-session/session-set.service";
import { useActiveWorkoutStore } from "@/features/workouts/stores/active-workout.store.ts";
import { useLocation } from "wouter";
import { path } from "@/core/constants/path.ts";
import { useAuthStore } from "@/features/auth/auth.store.ts";
import { useAppMutation } from "@/core/hooks/useAppMutation";
import { withRetry } from "@/lib/retry";
import type { FinishSessionPayload } from "../workout.types";

export const useWorkoutSession = (workoutId?: string) => {
    const [, navigate] = useLocation();
    const queryClient = useQueryClient();
    const token = useAuthStore((state) => state.token);
    const isAuthenticated = !!token;

    const { setActiveSession, clearState } = useActiveWorkoutStore();
    const activeSession = useActiveWorkoutStore((s) => s.activeSession);

    const sessionByUserQuery = useQuery({
        queryKey: ["workoutSessions"],
        queryFn: () => WorkoutSessionService.getByUserId(),
    });

    const sessionByWorkoutIdQuery = useQuery({
        queryKey: ["workoutSession", workoutId],
        queryFn: () => WorkoutSessionService.getByWorkoutId(workoutId!),
        enabled: !!workoutId,
    });

    const findActiveSessionQuery = useQuery({
        queryKey: ["activeSession"],
        queryFn: () => WorkoutSessionService.findActiveSession(),
        enabled: isAuthenticated,
    });

    // Sync Zustand with React Query for offline persistence
    useEffect(() => {
        if (findActiveSessionQuery.data) {
            setActiveSession(
                findActiveSessionQuery.data.activeSession,
                findActiveSessionQuery.data.lastSession
            );
        } else if (findActiveSessionQuery.isSuccess && !findActiveSessionQuery.data) {
            clearState();
        }
    }, [findActiveSessionQuery.data, findActiveSessionQuery.isSuccess, setActiveSession, clearState]);

    const createSessionMutation = useAppMutation({
        mutationFn: WorkoutSessionService.create,
        invalidateQueries: [["workoutSessions"], ["activeSession"]],
        suppressDefaultError: true,
        onSuccess: (data) => {
            const { newSession } = data;
            navigate(path.ACTIVE_WORKOUT + `/${newSession.workoutId}`);
        },
    });

    const [isFinishing, setIsFinishing] = useState(false);
    const [finishError, setFinishError] = useState<string | null>(null);

    const finishSession = async () => {
        if (!activeSession) return;
        setIsFinishing(true);
        setFinishError(null);

        const payload: FinishSessionPayload = {
            sets: activeSession.pendingSets ?? [],
        };

        try {
            await withRetry(
                () => SessionSetService.finishSession(activeSession.id, payload),
                { retries: 3, baseDelayMs: 2000 }
            );
            clearState();
            await queryClient.invalidateQueries({ queryKey: ["workoutSessions"] });
            navigate(`${path.WORKOUT_COMPLETE}/${activeSession.id}`);
        } catch {
            setFinishError(
                "Não foi possível finalizar o treino. Verifique sua conexão e tente novamente."
            );
        } finally {
            setIsFinishing(false);
        }
    };

    const deleteSessionMutation = useAppMutation({
        mutationFn: WorkoutSessionService.delete,
        invalidateQueries: [["activeSession"], ["workoutSessions"]],
        suppressDefaultError: true,
        onSuccess: () => {
            clearState();
            navigate(path.WORKOUTS);
        },
    });

    return {
        sessionByUserQuery,
        sessionByWorkoutIdQuery,
        findActiveSessionQuery,
        createSessionMutation,
        finishSession,
        isFinishing,
        finishError,
        deleteSessionMutation,
    }
}
