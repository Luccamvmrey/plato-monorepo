import { cn } from "@/lib/utils.ts";

interface ActiveWorkoutActionsProps {
    onFinishClick: () => void;
    onCancelClick: () => void;
    isFinishPending: boolean;
    isCancelPending: boolean;
    isAllCompleted: boolean;
}

export const ActiveWorkoutActions = ({
    onFinishClick,
    onCancelClick,
    isFinishPending,
    isCancelPending,
    isAllCompleted,
}: ActiveWorkoutActionsProps) => {
    return (
        <div className="fixed bottom-[92px] inset-x-0 p-4 pb-3 bg-background/95 backdrop-blur-sm border-t border-border flex items-center gap-3">
            <button
                onClick={onFinishClick}
                disabled={isFinishPending || isCancelPending}
                className={cn(
                    "flex-1 h-12 rounded-lg font-medium text-[15px] tracking-[-0.01em] transition-all",
                    isAllCompleted
                        ? "bg-success text-success-foreground"
                        : "bg-muted text-muted-foreground opacity-40 cursor-not-allowed"
                )}
            >
                {isFinishPending ? "Finalizando..." : "Finalizar Treino"}
            </button>
            <button
                onClick={onCancelClick}
                disabled={isFinishPending || isCancelPending}
                className="text-[13px] text-muted-foreground px-3 py-2 disabled:opacity-40"
            >
                Cancelar
            </button>
        </div>
    );
};
