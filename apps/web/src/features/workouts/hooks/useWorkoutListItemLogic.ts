import { useLocation } from "wouter";
import { useWorkoutSession } from "@/features/workouts/hooks/useWorkoutSession";
import { toast } from "sonner";
import { path } from "@/core/constants/path";
import type { Workout } from "@/features/workouts/workout.types";
import { useWorkouts } from "@/features/workouts/hooks/useWorkouts";

export const useWorkoutListItemLogic = (workout: Workout) => {
    const navigate = useLocation()[1];
    const { createSessionMutation, findActiveSessionQuery } = useWorkoutSession();
    const { toggleStatusMutation } = useWorkouts();
    const { data: activeSessionData, isLoading } = findActiveSessionQuery;
    const activeSession = activeSessionData?.activeSession;

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

            toast.error("Você já possui uma sessão ativa. Finalize-a antes de iniciar outro treino.");
            return;
        }

        createSessionMutation.mutate({ workoutId: workout.id });
    };

    const isResumingSession = activeSession?.workoutId === workout.id;

    return {
        handleEdit,
        handleQuickStart,
        handleToggleStatus,
        isLoading,
        isResumingSession,
        isPending: createSessionMutation.isPending || toggleStatusMutation.isPending,
    };
};
