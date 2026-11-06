import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/auth.store.ts";
import { useActiveWorkoutStore } from "@/features/workouts/stores/active-workout.store.ts";
import { NotificationService } from "../notification.service.ts";
import { getDeviceSubscription } from "../utils/push-support.ts";

/** Com o app aberto, o aviso na tela basta: cancela o push pouco antes do fim. */
const CANCEL_LEAD_MS = 3000;
const SETTINGS_STALE_MS = 5 * 60_000;

/**
 * O navegador suspende os timers em segundo plano, então quem avisa do fim do descanso é o
 * servidor. O pedido sai ao começar o descanso, com o app aberto: o pedido feito ao esconder
 * o app pode nem chegar a sair, principalmente no iPhone.
 */
export const useRestAlert = () => {
    const userId = useAuthStore((state) => state.user?.id);
    const restEndsAt = useActiveWorkoutStore((state) => state.restEndsAt);

    // A mesma chave da tela de notificações, mas só busca quando há um descanso em andamento.
    const { data: canAlert = false } = useQuery({
        queryKey: ["notification-settings", userId],
        queryFn: NotificationService.getSettings,
        enabled: userId !== undefined && restEndsAt !== null,
        staleTime: SETTINGS_STALE_MS,
        select: (settings) => settings.canDebug,
    });

    const hasScheduled = useRef(false);
    // Em fila: um cancelamento não pode ultrapassar o agendamento que veio antes dele.
    const queue = useRef<Promise<unknown>>(Promise.resolve());

    useEffect(() => {
        if (!canAlert) return;

        const enqueue = (task: () => Promise<unknown>) => {
            queue.current = queue.current.then(task).catch(() => undefined);
        };

        const cancel = () => {
            if (!hasScheduled.current) return;

            hasScheduled.current = false;
            enqueue(NotificationService.cancelRestAlert);
        };

        if (restEndsAt === null) {
            cancel();
            return;
        }

        const schedule = (remainingMs: number) => {
            hasScheduled.current = true;
            enqueue(async () => {
                const subscription = await getDeviceSubscription();

                if (subscription) {
                    await NotificationService.scheduleRestAlert(subscription.endpoint, remainingMs, restEndsAt);
                }
            });
        };

        const sync = () => {
            const remainingMs = restEndsAt - Date.now();

            if (remainingMs <= 0) return;

            if (document.visibilityState === "visible" && remainingMs <= CANCEL_LEAD_MS) {
                cancel();
            } else {
                schedule(remainingMs);
            }
        };

        sync();

        const timeout = setTimeout(sync, Math.max(0, restEndsAt - Date.now() - CANCEL_LEAD_MS));

        document.addEventListener("visibilitychange", sync);

        return () => {
            clearTimeout(timeout);
            document.removeEventListener("visibilitychange", sync);
        };
    }, [canAlert, restEndsAt]);
};
