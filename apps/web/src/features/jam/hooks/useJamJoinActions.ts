import { useState } from "react";
import { isAxiosError } from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { path } from "@/core/constants/path.ts";
import { useAppMutation } from "@/core/hooks/useAppMutation";
import { useBetaProgram } from "@/features/user/hooks/useBetaProgram.ts";
import { useTrackingMode } from "@/features/user/hooks/useTrackingMode.ts";
import type { TrackingModeValue } from "@/features/user/tracking-modes.ts";
import { useActiveSession } from "@/features/workouts/hooks/useActiveSession.ts";
import { JamService } from "@/features/jam/jam.service.ts";
import type { JoinJamResult } from "@/features/jam/jam.types.ts";
import { rememberJamEntry } from "@/features/jam/utils/jam-entry.ts";
import { statusOf } from "./useJamJoinPage.ts";

/** "Copiar" ou o id de um treino próprio. */
export type JamWorkoutChoice = "copy" | number;

const isOpenSessionConflict = (error: unknown) =>
    statusOf(error) === 409 &&
    isAxiosError(error) &&
    String(error.response?.data?.message ?? "").includes("open workout session");

const errorMessageOf = (error: unknown): string => {
    const message = isAxiosError(error) ? String(error.response?.data?.message ?? "") : "";

    if (statusOf(error) === 409) {
        if (message.includes("full")) return "A jam encheu: o limite é de 4 pessoas.";
        if (message.includes("ended")) return "Esta jam já terminou.";
    }

    return "Não foi possível entrar. Tente novamente.";
};

/** A parte logada da tela de entrada. Só montada com login: as consultas aqui exigem conta. */
export const useJamJoinActions = (token: string) => {
    const [, navigate] = useLocation();
    const queryClient = useQueryClient();
    const beta = useBetaProgram();
    const { needsChoice, saveTrackingMode } = useTrackingMode();
    const { findActiveSessionQuery } = useActiveSession();

    const [choice, setChoice] = useState<JamWorkoutChoice | null>(null);
    const [isChoosingMode, setIsChoosingMode] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isBlockedByServer, setIsBlockedByServer] = useState(false);

    const candidatesQuery = useQuery({
        queryKey: ["jam-candidates", token],
        queryFn: () => JamService.getCandidates(token),
        enabled: beta.isEnabled,
    });

    const candidates = candidatesQuery.data ?? [];
    // Sem escolha explícita, o mais provável: o primeiro treino próprio, senão a cópia.
    const selected: JamWorkoutChoice = choice ?? candidates[0]?.id ?? "copy";

    const activeSession = findActiveSessionQuery.data?.activeSession;
    // Treino aberto fora de qualquer jam: o servidor recusaria. Treino aberto numa jam pode
    // ser desta mesma (voltou pelo QR), e aí entrar só devolve a sessão que já existe; se
    // for de outra jam, só o servidor sabe, e a recusa dele liga o mesmo aviso.
    const blockingSession = activeSession && (activeSession.jamId === null || isBlockedByServer) ? activeSession : null;

    const joinMutation = useAppMutation({
        mutationFn: async (): Promise<JoinJamResult | null> => {
            if (!beta.isEnabled) {
                await beta.enable();

                // Ligou o beta agora: se a pessoa tem o treino, ela escolhe antes de entrar.
                const found = await queryClient.fetchQuery({
                    queryKey: ["jam-candidates", token],
                    queryFn: () => JamService.getCandidates(token),
                });

                if (found.length > 0) return null;
            }

            return JamService.join(token, selected === "copy" ? undefined : selected);
        },
        suppressDefaultError: true,
        onSuccess: (result: JoinJamResult | null) => {
            if (!result) return;
            if (result.entryExerciseId !== null) rememberJamEntry(result.sessionId, result.entryExerciseId);

            void queryClient.invalidateQueries({ queryKey: ["activeSession"] });
            void queryClient.invalidateQueries({ queryKey: ["sessions"] });
            void queryClient.invalidateQueries({ queryKey: ["workouts"] });
            navigate(`${path.ACTIVE_WORKOUT}/${result.workoutId}`);
        },
        onError: (mutationError: unknown) => {
            if (isOpenSessionConflict(mutationError)) {
                setIsBlockedByServer(true);
                void findActiveSessionQuery.refetch();
                return;
            }

            setError(errorMessageOf(mutationError));
        },
    });

    const join = () => {
        setError(null);
        joinMutation.mutate();
    };

    const handleJoin = () => {
        if (blockingSession) return;

        // O modo é copiado para a sessão no servidor: a escolha tem de vir antes.
        if (needsChoice) {
            setIsChoosingMode(true);
            return;
        }

        join();
    };

    const handleChooseMode = async (mode: TrackingModeValue) => {
        setIsChoosingMode(false);

        try {
            await saveTrackingMode(mode);
            join();
        } catch {
            setError("Não foi possível salvar sua escolha. Tente novamente.");
        }
    };

    return {
        isReady: beta.isLoaded && !findActiveSessionQuery.isLoading,
        isBetaEnabled: beta.isEnabled,
        candidates,
        selected,
        setChoice,
        blockingWorkoutName: blockingSession?.workout?.name ?? null,
        goToActiveWorkout: () => blockingSession && navigate(`${path.ACTIVE_WORKOUT}/${blockingSession.workoutId}`),
        isJoining: joinMutation.isPending,
        error,
        handleJoin,
        isChoosingMode,
        handleChooseMode,
        cancelChoosingMode: () => setIsChoosingMode(false),
    };
};
