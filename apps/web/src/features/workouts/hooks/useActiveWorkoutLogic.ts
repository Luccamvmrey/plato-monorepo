import { useLocation, useParams } from "wouter";
import { useState, useMemo } from "react";
import { useWorkoutSession } from "./useWorkoutSession";
import { useWorkouts } from "./useWorkouts";
import { useExerciseStack } from "./useExerciseStack";
import { useExerciseHistory } from "./useExerciseHistory";
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

    const { workoutByIdQuery } = useWorkouts(id);
    const { data: workout, isLoading: isLoadingWorkout } = workoutByIdQuery;

    // Um fetch de histórico por sessão, não um por exercício — é o que alimenta a
    // prescrição de carga de cada card.
    const { data: exerciseHistory } = useExerciseHistory(activeSession?.workoutId);

    const pendingSets = useActiveWorkoutStore((s) => s.activeSession?.pendingSets);
    const sessionExerciseOrder = useActiveWorkoutStore((s) => s.activeSession?.sessionExerciseOrder ?? null);
    const exerciseExtraSets = useActiveWorkoutStore((s) => s.activeSession?.exerciseExtraSets);
    const setExerciseOrder = useActiveWorkoutStore((s) => s.setExerciseOrder);
    const addExtraSet = useActiveWorkoutStore((s) => s.addExtraSet);

    const { exerciseStack } = useExerciseStack(
        workout,
        activeSession || undefined,
        pendingSets,
        sessionExerciseOrder,
        exerciseExtraSets,
    );

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
        exerciseHistory,
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
        setExerciseOrder,
        addExtraSet,
    };
};
