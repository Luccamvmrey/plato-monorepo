import { Button } from "@/components/ui/button.tsx";
import { useRestTimer } from "@/features/workouts/hooks/useRestTimer.ts";

const ADJUST_STEP_SECONDS = 15;

export const RestTimerBar = () => {
    const { isVisible, isFinished, clock, adjustRest, dismissRest } = useRestTimer();

    if (!isVisible) return null;

    if (isFinished) {
        return (
            <p role="status" className="h-11 flex items-center justify-center text-[14px] font-medium text-success">
                Descanso concluído. Próxima série!
            </p>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 flex items-baseline gap-2 min-w-0">
                <span role="timer" className="text-[22px] font-semibold tabular-nums tracking-[-0.02em]">
                    {clock}
                </span>
                <span className="text-[13px] text-muted-foreground">descanso</span>
            </div>
            <Button
                variant="outline"
                className="h-11 w-12 tabular-nums"
                aria-label={`Diminuir ${ADJUST_STEP_SECONDS} segundos`}
                onClick={() => adjustRest(-ADJUST_STEP_SECONDS)}
            >
                −{ADJUST_STEP_SECONDS}
            </Button>
            <Button
                variant="outline"
                className="h-11 w-12 tabular-nums"
                aria-label={`Aumentar ${ADJUST_STEP_SECONDS} segundos`}
                onClick={() => adjustRest(ADJUST_STEP_SECONDS)}
            >
                +{ADJUST_STEP_SECONDS}
            </Button>
            <Button variant="ghost" className="h-11 px-3" onClick={dismissRest}>
                Pular
            </Button>
        </div>
    );
};
