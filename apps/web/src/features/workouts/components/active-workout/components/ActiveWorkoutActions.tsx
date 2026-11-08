import { useKeyboardOpen } from "@/core/hooks/useKeyboardOpen.ts";
import { cn } from "@/lib/utils.ts";
import { useActiveWorkoutStore } from "@/features/workouts/stores/active-workout.store";
import { RestTimerBar } from "./RestTimerBar";

interface ActiveWorkoutActionsProps {
    onFinishClick: () => void;
    isFinishPending: boolean;
    isCancelPending: boolean;
    isAllCompleted: boolean;
}

export const ActiveWorkoutActions = ({
    onFinishClick,
    isFinishPending,
    isCancelPending,
    isAllCompleted,
}: ActiveWorkoutActionsProps) => {
    const isKeyboardOpen = useKeyboardOpen();
    const isResting = useActiveWorkoutStore((s) => s.restEndsAt !== null);

    // Sem série pela frente não há o que descansar.
    const showRest = isResting && !isAllCompleted;

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
            {showRest ? (
                <RestTimerBar />
            ) : (
                <button
                    onClick={onFinishClick}
                    disabled={isFinishPending || isCancelPending}
                    className={cn(
                        "w-full h-12 rounded-lg font-medium text-[15px] tracking-[-0.01em] transition-all",
                        isAllCompleted
                            ? "bg-success text-success-foreground"
                            : "bg-muted text-muted-foreground"
                    )}
                >
                    {isFinishPending ? "Finalizando..." : "Finalizar Treino"}
                </button>
            )}
        </div>
    );
};
