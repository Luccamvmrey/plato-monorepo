import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
    jamExerciseMode,
    jamMemberProgress,
    type JamExerciseModeValue,
    type JamMemberProgress,
    type JamMemberState,
} from "@plato/shared";
import { useAppMutation } from "@/core/hooks/useAppMutation";
import { useAuthStore } from "@/features/auth/auth.store.ts";
import { useActiveWorkoutStore } from "@/features/workouts/stores/active-workout.store.ts";
import type { EnrichedExerciseRecord, WorkoutSession } from "@/features/workouts/workout.types.ts";
import { JamService } from "@/features/jam/jam.service.ts";
import { consumeJamEntry } from "@/features/jam/utils/jam-entry.ts";
import { jamQueryKey, useJam } from "./useJam.ts";
import { useJamTurn } from "./useJamTurn.ts";

/** Espera a tela assentar antes de avisar o grupo: reordenar ou confirmar série mexe no exercício atual. */
const PRESENCE_DEBOUNCE_MS = 500;

export interface JamParticipant {
    userId: number;
    name: string;
    isMe: boolean;
    isHost: boolean;
    progress: JamMemberProgress;
}

const toParticipant = (member: JamMemberState, hostUserId: number, currentUserId: number | undefined): JamParticipant => ({
    userId: member.userId,
    name: member.name,
    isMe: member.userId === currentUserId,
    isHost: member.userId === hostUserId,
    progress: jamMemberProgress(member),
});

/**
 * A jam vista de dentro da sessão ativa. Tudo aqui é camada: se a jam falhar, `isActive` fica
 * falso, a faixa some e o treino segue como sem jam.
 */
export const useActiveJam = (session: WorkoutSession | undefined, exerciseStack: EnrichedExerciseRecord[]) => {
    const queryClient = useQueryClient();
    const currentUserId = useAuthStore((state) => state.user?.id);
    const storedSessionId = useActiveWorkoutStore((state) => state.activeSession?.id);
    const restEndsAt = useActiveWorkoutStore((state) => state.restEndsAt);
    const setExerciseOrder = useActiveWorkoutStore((state) => state.setExerciseOrder);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const jamId = session?.jamId ?? null;
    const { data: jam } = useJam(jamId);

    const me = jam?.members.find((member) => member.userId === currentUserId);
    const isActive = !!jam && jam.endedAt === null && !!me && me.leftAt === null;

    const activeExercise = exerciseStack.find((exercise) => exercise.status === "ACTIVE");
    const activeExerciseId = activeExercise?.exerciseId ?? null;

    // Quem entrou no meio começa no exercício do grupo. Uma vez só, e só depois que a sessão
    // chegou ao store: antes disso a ordem não tem onde ser guardada.
    useEffect(() => {
        if (!session || storedSessionId !== session.id || exerciseStack.length === 0) return;

        const entryId = consumeJamEntry(session.id);
        if (entryId === null || !exerciseStack.some((exercise) => exercise.exerciseId === entryId)) return;

        const ids = exerciseStack.map((exercise) => exercise.exerciseId);
        setExerciseOrder([entryId, ...ids.filter((id) => id !== entryId)]);
    }, [session, storedSessionId, exerciseStack, setExerciseOrder]);

    // Onde estou e quando meu descanso acaba. Erro de rede é silencioso: a próxima mudança
    // manda de novo, e o palpite pelas séries cobre o intervalo.
    useEffect(() => {
        if (!isActive || jamId === null) return;

        const timeout = setTimeout(() => {
            void JamService.updatePresence(jamId, { exerciseId: activeExerciseId, restEndsAt }).catch(() => undefined);
        }, PRESENCE_DEBOUNCE_MS);

        return () => clearTimeout(timeout);
    }, [isActive, jamId, activeExerciseId, restEndsAt]);

    const participants = useMemo(
        () => jam
            ? jam.members
                .filter((member) => member.leftAt === null)
                .map((member) => toParticipant(member, jam.hostUserId, currentUserId))
            : [],
        [jam, currentUserId]
    );

    const modeMutation = useAppMutation({
        mutationFn: JamService.setExerciseMode,
        onSuccess: () => jamId !== null && void queryClient.invalidateQueries({ queryKey: jamQueryKey(jamId) }),
    });

    const leaveMutation = useAppMutation({
        mutationFn: JamService.leave,
        onSuccess: () => {
            setIsSheetOpen(false);
            if (jamId !== null) void queryClient.invalidateQueries({ queryKey: jamQueryKey(jamId) });
        },
    });

    const currentMode: JamExerciseModeValue | null = jam && activeExerciseId !== null
        ? jamExerciseMode(jam.exerciseModes, activeExerciseId)
        : null;

    const turn = useJamTurn(isActive ? jam : undefined, activeExercise, currentMode, currentUserId);

    return {
        isActive,
        jam,
        participants,
        others: participants.filter((participant) => !participant.isMe),
        activeExerciseId,
        activeExerciseName: activeExercise?.exercise.name ?? null,
        currentMode,
        setCurrentMode: (mode: JamExerciseModeValue) => {
            if (jamId === null || activeExerciseId === null) return;
            modeMutation.mutate({ jamId, exerciseId: activeExerciseId, mode });
        },
        isChangingMode: modeMutation.isPending,
        myTurn: turn.myTurn,
        partnerTurn: turn.partnerTurn,
        leave: () => jamId !== null && leaveMutation.mutate(jamId),
        isLeaving: leaveMutation.isPending,
        isSheetOpen,
        openSheet: () => setIsSheetOpen(true),
        closeSheet: () => setIsSheetOpen(false),
    };
};

export type ActiveJam = ReturnType<typeof useActiveJam>;
