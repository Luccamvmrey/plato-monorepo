import type { ReactNode } from "react";
import { useKeyboardOpen } from "@/core/hooks/useKeyboardOpen.ts";
import { cn } from "@/lib/utils.ts";
import { useActiveWorkoutStore } from "@/features/workouts/stores/active-workout.store";
import { RestTimerBar } from "./RestTimerBar";

interface ActiveWorkoutActionsProps {
    onFinishClick: () => void;
    isFinishPending: boolean;
    isCancelPending: boolean;
    isAllCompleted: boolean;
    /** Ocupa o lugar do descanso e do Finalizar: a vez do parceiro na jam. */
    overridePanel?: ReactNode;
}

export const ActiveWorkoutActions = ({
    onFinishClick,
    isFinishPending,
    isCancelPending,
    isAllCompleted,
    overridePanel,
}: ActiveWorkoutActionsProps) => {
    const isKeyboardOpen = useKeyboardOpen();
    const isResting = useActiveWorkoutStore((s) => s.restEndsAt !== null);

    // Sem série pela frente não há o que descansar.
    const showRest = isResting && !isAllCompleted;

    const finishButton = (className: string) => (
        <button
            onClick={onFinishClick}
            disabled={isFinishPending || isCancelPending}
            className={cn(
                "h-12 rounded-lg font-medium text-[15px] tracking-[-0.01em] transition-all",
                isAllCompleted
                    ? "bg-success text-success-foreground"
                    : "bg-muted text-muted-foreground",
                className
            )}
        >
            {isFinishPending ? "Finalizando..." : overridePanel ? "Finalizar" : "Finalizar Treino"}
        </button>
    );

    return (
        <div
            className={cn(
                // Sem NavBar durante a sessão, a barra encosta no fundo e carrega o
                // inset do home indicator ela mesma.
                "fixed bottom-0 inset-x-0 z-40 px-4 pt-3 pb-[calc(var(--safe-bottom)+0.75rem)] bg-background/95 backdrop-blur-sm border-t border-border",
                // Finishing is never the next action while logging a set, and this
                // bar sits directly over the RPE selector and confirm button once
                // the keyboard is up.
                isKeyboardOpen && "hidden"
            )}
        >
            {/* Uma linha só: o descanso ocupa o lugar do Finalizar enquanto corre.
                Empilhados, os dois cobriam o botão de confirmar a próxima série. */}
            {/* A vez do parceiro pode durar o quanto ele quiser: o Finalizar encolhe ao
                lado, em vez de sumir como no descanso. */}
            {overridePanel ? (
                <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">{overridePanel}</div>
                    {finishButton("shrink-0 px-4")}
                </div>
            ) : showRest ? (
                <RestTimerBar />
            ) : (
                finishButton("w-full")
            )}
        </div>
    );
};
