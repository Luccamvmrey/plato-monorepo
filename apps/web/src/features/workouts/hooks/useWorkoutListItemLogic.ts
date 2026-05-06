import { useLocation } from "wouter";
import { useActiveSession } from "@/features/workouts/hooks/useActiveSession";
import { useState } from "react";
import { path } from "@/core/constants/path";
import type { Workout } from "@/features/workouts/workout.types";
import { useWorkouts } from "@/features/workouts/hooks/useWorkouts";

export const useWorkoutListItemLogic = (workout: Workout) => {
    const navigate = useLocation()[1];
    const { createSessionMutation, findActiveSessionQuery } = useActiveSession();
    const { toggleStatusMutation } = useWorkouts();
    const { data: activeSessionData, isLoading } = findActiveSessionQuery;
    const activeSession = activeSessionData?.activeSession;

    const [conflictError, setConflictError] = useState<string | null>(null);

    const handleEdit = () => {
        navigate(path.WORKOUT_EDITOR + `/${workout.id}`);
    };

    const handleToggleStatus = () => {
        toggleStatusMutation.mutate(workout.id);
    };

    const handleQuickStart = () => {
        if (isLoading) return;

        if (activeSession) {
            if (activeSession.workoutId === workout.id) {
                navigate(`${path.ACTIVE_WORKOUT}/${workout.id}`);
                return;
            }

            setConflictError("Você já possui uma sessão ativa. Finalize-a antes de iniciar outro treino.");
            return;
        }

        setConflictError(null);
        createSessionMutation.mutate({ workoutId: workout.id });
    };

    const isResumingSession = activeSession?.workoutId === workout.id;

    const createError = createSessionMutation.isError
        ? "Algo deu errado ao iniciar a sessão. Tente novamente."
        : null;

    return {
        handleEdit,
        handleQuickStart,
        handleToggleStatus,
        isLoading,
        isResumingSession,
        isPending: createSessionMutation.isPending || toggleStatusMutation.isPending,
        conflictError,
        createError,
    };
};
