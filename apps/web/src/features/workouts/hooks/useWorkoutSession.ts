import { useQuery } from "@tanstack/react-query";
import { WorkoutSessionService } from "../services/workout-session/workout-session.service";
import { useActiveWorkoutStore } from "@/features/workouts/stores/active-workout.store.ts";
import { useLocation } from "wouter";
import { path } from "@/core/constants/path.ts";
import { useAuthStore } from "@/features/auth/auth.store.ts";
import { useAppMutation } from "@/core/hooks/useAppMutation";
import { useEffect } from "react";

export const useWorkoutSession = (workoutId?: string) => {
    const [, navigate] = useLocation();
    const token = useAuthStore((state) => state.token);
    const isAuthenticated = !!token;
    
    const { setActiveSession, clearState } = useActiveWorkoutStore();

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
        onSuccess: (data) => {
            const { newSession } = data;
            navigate(path.ACTIVE_WORKOUT + `/${newSession.workoutId}`);
        },
        errorMessage: "Algo deu errado ao iniciar a sessão. Tente novamente mais tarde."
    });

    const finishSessionMutation = useAppMutation({
        mutationFn: WorkoutSessionService.finish,
        invalidateQueries: [["activeSession"], ["workoutSessions"]],
        onSuccess: (finishedSession) => {
            navigate(`${path.WORKOUT_SUMMARY}/${finishedSession.id}`);
        },
        successMessage: "Treino finalizado com sucesso!",
        errorMessage: "Algo deu errado ao finalizar a sessão. Tente novamente mais tarde."
    });

    const deleteSessionMutation = useAppMutation({
        mutationFn: WorkoutSessionService.delete,
        invalidateQueries: [["activeSession"], ["workoutSessions"]],
        onSuccess: () => {
            clearState();
            navigate(path.WORKOUTS);
        },
        successMessage: "Treino cancelado.",
        errorMessage: "Algo deu errado ao cancelar a sessão. Tente novamente mais tarde."
    });

    return {
        sessionByUserQuery,
        sessionByWorkoutIdQuery,
        findActiveSessionQuery,
        createSessionMutation,
        finishSessionMutation,
        deleteSessionMutation,
    }
}