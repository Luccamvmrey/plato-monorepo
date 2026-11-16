import { useLocation } from "wouter";
import { useActiveSession } from "@/features/workouts/hooks/useActiveSession";
import { useAppMutation } from "@/core/hooks/useAppMutation";
import { useState } from "react";
import { path } from "@/core/constants/path";
import type { Workout } from "@/features/workouts/workout.types";
import { WorkoutService } from "@/features/workouts/services/workout.service";
import { useTrackingMode } from "@/features/user/hooks/useTrackingMode";
import type { TrackingModeValue } from "@/features/user/tracking-modes";
import { useBetaProgram } from "@/features/user/hooks/useBetaProgram";
import { JamService } from "@/features/jam/jam.service";
import type { CreateJamResult } from "@/features/jam/jam.types";

/** O que o toque pediu: o modo de treino pode ser perguntado antes de qualquer um dos dois. */
type StartKind = "solo" | "jam";

export const useWorkoutListItemLogic = (workout: Workout) => {
    const navigate = useLocation()[1];
    const { createSessionMutation, findActiveSessionQuery } = useActiveSession();
    const { needsChoice, saveTrackingMode, isLoading: isLoadingMode } = useTrackingMode();
    const { isEnabled: isBetaEnabled } = useBetaProgram();
    const createJamMutation = useAppMutation({
        mutationFn: JamService.create,
        invalidateQueries: [["sessions"], ["activeSession"]],
        suppressDefaultError: true,
        onSuccess: (jam: CreateJamResult) => navigate(`${path.JAM}/${jam.jamId}/qr`),
    });
    const toggleStatusMutation = useAppMutation({
        mutationFn: WorkoutService.toggleStatus,
        invalidateQueries: [["workouts"]],
    });
    const { data: activeSessionData, isLoading: isLoadingSession } = findActiveSessionQuery;
    const activeSession = activeSessionData?.activeSession;
    const isLoading = isLoadingSession || isLoadingMode;

    const [conflictError, setConflictError] = useState<string | null>(null);
    const [choosingModeFor, setChoosingModeFor] = useState<StartKind | null>(null);

    const handleEdit = () => {
        navigate(path.WORKOUT_EDITOR + `/${workout.id}`);
    };

    const handleToggleStatus = () => {
        toggleStatusMutation.mutate(workout.id);
    };

    const start = (kind: StartKind) => {
        setConflictError(null);

        if (kind === "jam") createJamMutation.mutate(workout.id);
        else createSessionMutation.mutate({ workoutId: workout.id });
    };

    const requestStart = (kind: StartKind) => {
        if (isLoading) return;

        if (activeSession) {
            if (kind === "solo" && activeSession.workoutId === workout.id) {
                navigate(`${path.ACTIVE_WORKOUT}/${workout.id}`);
                return;
            }

            setConflictError("Você já possui uma sessão ativa. Finalize-a antes de iniciar outro treino.");
            return;
        }

        if (needsChoice) {
            setChoosingModeFor(kind);
            return;
        }

        start(kind);
    };

    // A preferência tem de estar salva ANTES de criar a sessão: é o servidor que copia
    // o modo do usuário para a sessão nova.
    const handleChooseMode = async (mode: TrackingModeValue) => {
        const kind = choosingModeFor ?? "solo";
        setChoosingModeFor(null);

        try {
            await saveTrackingMode(mode);
            start(kind);
        } catch {
            setConflictError("Não foi possível salvar sua escolha. Tente novamente.");
        }
    };

    const isResumingSession = activeSession?.workoutId === workout.id;

    const createError = createSessionMutation.isError || createJamMutation.isError
        ? "Algo deu errado ao iniciar a sessão. Tente novamente."
        : null;

    return {
        handleEdit,
        handleQuickStart: () => requestStart("solo"),
        handleStartJam: () => requestStart("jam"),
        canStartJam: isBetaEnabled && workout.isActive,
        isStartingJam: createJamMutation.isPending,
        handleToggleStatus,
        isLoading,
        isResumingSession,
        isPending: createSessionMutation.isPending || createJamMutation.isPending || toggleStatusMutation.isPending,
        conflictError,
        createError,
        isChoosingMode: choosingModeFor !== null,
        handleChooseMode,
        cancelChoosingMode: () => setChoosingModeFor(null),
    };
};
