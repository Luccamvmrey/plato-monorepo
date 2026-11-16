import { useEffect, useRef, useState } from "react";
import {
    isPlateLoaded,
    jamLastWeight,
    jamPlateSwap,
    jamTurnForExercise,
    type JamExerciseModeValue,
    type JamState,
} from "@plato/shared";
import type { EnrichedExerciseRecord } from "@/features/workouts/workout.types.ts";

const TURN_VIBRATION = [200, 100, 200];

export interface JamPartnerTurn {
    userId: number;
    name: string;
    /** A carga da última série dela neste exercício. */
    weightKg: number | null;
}

export interface JamMyTurn {
    /** Quem usou o aparelho por último, para a troca de anilhas. */
    previousName: string | null;
    plateSwap: { action: "ADD" | "REMOVE"; perSideKg: number; fromKg: number; toKg: number } | null;
}

/**
 * Revezamento no exercício atual. Fora de revezamento, ou com menos de duas pessoas no
 * rodízio, não há vez: os dois retornos ficam null e a sessão é a de sempre.
 */
export const useJamTurn = (
    jam: JamState | undefined,
    activeExercise: EnrichedExerciseRecord | undefined,
    mode: JamExerciseModeValue | null,
    currentUserId: number | undefined
) => {
    const exerciseId = activeExercise?.exerciseId ?? null;
    const turnUserId = jam && exerciseId !== null && mode === "ALTERNATE"
        ? jamTurnForExercise(jam, exerciseId)
        : null;

    // Ajustado no render, quando a vez muda: quem teve a vez antes de mim é de quem é a carga
    // que está na barra.
    const [tracked, setTracked] = useState(() => ({ turnUserId, previousHolder: null as number | null }));

    if (tracked.turnUserId !== turnUserId) {
        setTracked({
            turnUserId,
            previousHolder: tracked.turnUserId !== null && tracked.turnUserId !== currentUserId
                ? tracked.turnUserId
                : tracked.previousHolder,
        });
    }

    const lastTurn = useRef<number | null>(turnUserId);

    useEffect(() => {
        const previous = lastTurn.current;
        lastTurn.current = turnUserId;

        // Só quando a vez CHEGA: abrir a tela já na sua vez não vibra.
        if (previous !== turnUserId && previous !== null && turnUserId !== null && turnUserId === currentUserId) {
            navigator.vibrate?.(TURN_VIBRATION);
        }
    }, [turnUserId, currentUserId]);

    const previousHolder = tracked.previousHolder;

    if (!jam || exerciseId === null || turnUserId === null) return { myTurn: null, partnerTurn: null };

    const memberOf = (userId: number | null) => jam.members.find((member) => member.userId === userId);

    if (turnUserId !== currentUserId) {
        const partner = memberOf(turnUserId);

        return {
            myTurn: null,
            partnerTurn: partner
                ? { userId: partner.userId, name: partner.name, weightKg: jamLastWeight(partner, exerciseId) }
                : null,
        };
    }

    const previous = memberOf(previousHolder);
    const fromKg = previous ? jamLastWeight(previous, exerciseId) : null;
    const lastLog = activeExercise?.logs.reduce<(typeof activeExercise.logs)[number] | null>(
        (latest, log) => (latest === null || log.setNumber > latest.setNumber ? log : latest),
        null
    );
    const toKg = lastLog?.actualWeight ?? null;
    const swap = fromKg !== null && toKg !== null && isPlateLoaded(activeExercise?.exercise.equipment)
        ? jamPlateSwap(fromKg, toKg)
        : null;

    return {
        myTurn: {
            previousName: previous?.name ?? null,
            plateSwap: swap && fromKg !== null && toKg !== null ? { ...swap, fromKg, toKg } : null,
        } satisfies JamMyTurn,
        partnerTurn: null,
    };
};
