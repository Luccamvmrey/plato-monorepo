import { useLocation, useParams } from "wouter";
import { useState, useMemo } from "react";
import { useWorkoutSession } from "./useWorkoutSession";
import { useWorkouts } from "./useWorkouts";
import { useExerciseStack } from "./useExerciseStack";
import { useActiveWorkoutStore } from "@/features/workouts/stores/active-workout.store";

export const useActiveWorkoutLogic = () => {
    const navigate = useLocation()[1];
    const { id } = useParams();
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);

    const {
        findActiveSessionQuery,
        finishSession,
        deleteSessionMutation,
    } = useWorkoutSession();
    const { data: sessionData, isLoading: isLoadingSession } = findActiveSessionQuery;
    const activeSession = sessionData?.activeSession;
    const lastSession = sessionData?.lastSession;

    const { workoutByIdQuery } = useWorkouts(id);
    const { data: workout, isLoading: isLoadingWorkout } = workoutByIdQuery;

    const pendingSets = useActiveWorkoutStore((s) => s.activeSession?.pendingSets);
    const { exerciseStack } = useExerciseStack(workout, activeSession || undefined, pendingSets);

    const isAllCompleted = useMemo(() => {
        if (!exerciseStack.length) return false;
        return exerciseStack.every(ex => ex.status === "COMPLETED");
    }, [exerciseStack]);

    const handleFinishClick = () => {
        if (isAllCompleted) {
            handleFinishConfirm();
        } else {
            setIsConfirmOpen(true);
        }
    };

    const handleFinishConfirm = () => {
        if (!activeSession) return;
        void finishSession();
        setIsConfirmOpen(false);
    };

    const handleCancelConfirm = () => {
        if (!activeSession) return;
        deleteSessionMutation.mutate(activeSession.id);
        setIsCancelOpen(false);
    };

    const isLoading = isLoadingSession || (!!id && isLoadingWorkout);

    const cancelError = deleteSessionMutation.isError
        ? "Algo deu errado ao cancelar a sessão. Tente novamente."
        : null;

    return {
        id,
        navigate,
        activeSession,
        lastSession,
        workout,
        exerciseStack,
        isLoading,
        isConfirmOpen,
        setIsConfirmOpen,
        isCancelOpen,
        setIsCancelOpen,
        handleFinishClick,
        handleFinishConfirm,
        handleCancelConfirm,
        cancelError,
        isCancelPending: deleteSessionMutation.isPending,
        isAllCompleted,
    };
};
