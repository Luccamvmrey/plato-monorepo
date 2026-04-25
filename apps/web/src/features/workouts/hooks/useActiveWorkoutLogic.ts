import { useLocation, useParams } from "wouter";
import { useState, useMemo, useEffect } from "react";
import { useWorkoutSession } from "./useWorkoutSession";
import { useWorkouts } from "./useWorkouts";
import { useExerciseStack } from "./useExerciseStack";
import { path } from "@/core/constants/path";

export const useActiveWorkoutLogic = () => {
    const navigate = useLocation()[1];
    const { id } = useParams();
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);

    const { findActiveSessionQuery, finishSessionMutation, deleteSessionMutation } = useWorkoutSession();
    const { data: sessionData, isLoading: isLoadingSession, isFetched: isSessionFetched } = findActiveSessionQuery;
    const activeSession = sessionData?.activeSession;
    const lastSession = sessionData?.lastSession;

    const { workoutByIdQuery } = useWorkouts(id);
    const { data: workout, isLoading: isLoadingWorkout } = workoutByIdQuery;

    const { exerciseStack } = useExerciseStack(workout, activeSession || undefined);

    const isAllCompleted = useMemo(() => {
        if (!exerciseStack.length) return false;
        return exerciseStack.every(ex => ex.status === "COMPLETED");
    }, [exerciseStack]);

    useEffect(() => {
        if (isLoadingSession || !isSessionFetched) return;

        if (activeSession && !id) {
            navigate(`${path.ACTIVE_WORKOUT}/${activeSession.workoutId}`);
            return;
        }
    }, [activeSession, id, isLoadingSession, isSessionFetched, navigate]);

    const handleFinishClick = () => {
        if (isAllCompleted) {
            handleFinishConfirm();
        } else {
            setIsConfirmOpen(true);
        }
    };

    const handleFinishConfirm = () => {
        if (!activeSession) return;
        finishSessionMutation.mutate(activeSession.id);
        setIsConfirmOpen(false);
    };

    const handleCancelConfirm = () => {
        if (!activeSession) return;
        deleteSessionMutation.mutate(activeSession.id);
        setIsCancelOpen(false);
    };

    const isLoading = isLoadingSession || (!!id && isLoadingWorkout);

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
        isFinishPending: finishSessionMutation.isPending,
        isCancelPending: deleteSessionMutation.isPending,
    };
};
