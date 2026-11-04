import { useEffect, useState } from "react";
import { useActiveWorkoutStore } from "@/features/workouts/stores/active-workout.store";

const TICK_MS = 250;
const FINISHED_MESSAGE_MS = 4000;
// Voltar ao app muito depois do fim não é "acabou agora": nada de vibrar.
const VIBRATE_WINDOW_MS = 2000;

const formatClock = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

export const useRestTimer = () => {
    const restEndsAt = useActiveWorkoutStore((s) => s.restEndsAt);
    const adjustRest = useActiveWorkoutStore((s) => s.adjustRest);
    const dismissRest = useActiveWorkoutStore((s) => s.dismissRest);

    const [now, setNow] = useState(() => Date.now());

    // Conta a partir do timestamp, não por decremento: com a tela apagada o navegador
    // suspende os timers, e um contador por decremento voltaria atrasado.
    useEffect(() => {
        if (restEndsAt === null) return;

        const interval = setInterval(() => setNow(Date.now()), TICK_MS);

        return () => clearInterval(interval);
    }, [restEndsAt]);

    const isFinished = restEndsAt !== null && now >= restEndsAt;

    useEffect(() => {
        if (!isFinished || restEndsAt === null) return;

        if (Date.now() - restEndsAt < VIBRATE_WINDOW_MS) {
            // Sem suporte no iOS: lá o aviso é só visual.
            navigator.vibrate?.([200, 100, 200]);
        }

        const timeout = setTimeout(dismissRest, FINISHED_MESSAGE_MS);

        return () => clearTimeout(timeout);
    }, [isFinished, restEndsAt, dismissRest]);

    const remainingSeconds = restEndsAt === null
        ? 0
        : Math.max(0, Math.ceil((restEndsAt - now) / 1000));

    return {
        isVisible: restEndsAt !== null,
        isFinished,
        clock: formatClock(remainingSeconds),
        adjustRest,
        dismissRest,
    };
};
