import { useEffect, useRef } from "react";
import { shouldSendDraft } from "@plato/shared";
import { useActiveWorkoutStore } from "@/features/workouts/stores/active-workout.store.ts";
import { WorkoutSessionService } from "../services/workout-session/workout-session.service.ts";

/**
 * Envia as séries da sessão ativa ao servidor enquanto a pessoa treina. Sem isso elas ficam só
 * no aparelho até concluir, e quem esquece de concluir fica com o treino preso.
 *
 * Fica no Layout, e não na tela da sessão, para enviar assim que o app abre: quem volta dias
 * depois ainda tem séries que o servidor não conhece. Sem rede, tenta de novo ao reconectar
 * ou ao voltar para o app.
 */
export const useSessionDraftSync = () => {
    const sessionId = useActiveWorkoutStore((state) => state.activeSession?.id);
    const startedAt = useActiveWorkoutStore((state) => state.activeSession?.startedAt);
    const pendingSets = useActiveWorkoutStore((state) => state.activeSession?.pendingSets);
    const lastSetAt = useActiveWorkoutStore((state) => state.lastSetAt);

    const lastSent = useRef<string | null>(null);
    // Em fila: um envio antigo não pode chegar depois de um novo e apagar a última série.
    const queue = useRef<Promise<unknown>>(Promise.resolve());

    useEffect(() => {
        if (sessionId === undefined || startedAt === undefined) return;

        const sets = pendingSets ?? [];
        const signature = JSON.stringify([sessionId, sets]);

        const sync = () => {
            if (document.visibilityState !== "visible" || lastSent.current === signature) return;
            if (!shouldSendDraft(sets.length, new Date(startedAt).getTime(), Date.now())) return;

            queue.current = queue.current
                .then(async () => {
                    if (lastSent.current === signature) return;

                    await WorkoutSessionService.saveDraft(sessionId, { sets, lastSetAt: lastSetAt ?? null });
                    lastSent.current = signature;
                })
                .catch(() => undefined);
        };

        sync();

        window.addEventListener("online", sync);
        document.addEventListener("visibilitychange", sync);

        return () => {
            window.removeEventListener("online", sync);
            document.removeEventListener("visibilitychange", sync);
        };
    }, [sessionId, startedAt, pendingSets, lastSetAt]);
};
