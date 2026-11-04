import { useLocation } from "wouter";
import { useActiveSession } from "@/features/workouts/hooks/useActiveSession";
import { useAppMutation } from "@/core/hooks/useAppMutation";
import { useState } from "react";
import { path } from "@/core/constants/path";
import type { Workout } from "@/features/workouts/workout.types";
import { WorkoutService } from "@/features/workouts/services/workout.service";
import { useTrackingMode } from "@/features/user/hooks/useTrackingMode";
import type { TrackingModeValue } from "@/features/user/tracking-modes";

export const useWorkoutListItemLogic = (workout: Workout) => {
    const navigate = useLocation()[1];
    const { createSessionMutation, findActiveSessionQuery } = useActiveSession();
    const { needsChoice, saveTrackingMode, isLoading: isLoadingMode } = useTrackingMode();
    const toggleStatusMutation = useAppMutation({
        mutationFn: WorkoutService.toggleStatus,
        invalidateQueries: [["workouts"]],
    });
    const { data: activeSessionData, isLoading: isLoadingSession } = findActiveSessionQuery;
    const activeSession = activeSessionData?.activeSession;
    const isLoading = isLoadingSession || isLoadingMode;

    const [conflictError, setConflictError] = useState<string | null>(null);
    const [isChoosingMode, setIsChoosingMode] = useState(false);

    const handleEdit = () => {
        navigate(path.WORKOUT_EDITOR + `/${workout.id}`);
    };

    const handleToggleStatus = () => {
        toggleStatusMutation.mutate(workout.id);
    };

    const startSession = () => {
        setConflictError(null);
        createSessionMutation.mutate({ workoutId: workout.id });
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

        if (needsChoice) {
            setIsChoosingMode(true);
            return;
        }

        startSession();
    };

    // A preferência tem de estar salva ANTES de criar a sessão: é o servidor que copia
    // o modo do usuário para a sessão nova.
    const handleChooseMode = async (mode: TrackingModeValue) => {
        setIsChoosingMode(false);

        try {
            await saveTrackingMode(mode);
            startSession();
        } catch {
            setConflictError("Não foi possível salvar sua escolha. Tente novamente.");
        }
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
        isChoosingMode,
        handleChooseMode,
        cancelChoosingMode: () => setIsChoosingMode(false),
    };
};
