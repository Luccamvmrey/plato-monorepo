import { Button } from "@/components/ui/button.tsx";

interface ActiveWorkoutActionsProps {
    onFinishClick: () => void;
    onCancelClick: () => void;
    isFinishPending: boolean;
    isCancelPending: boolean;
}

export const ActiveWorkoutActions = ({
    onFinishClick,
    onCancelClick,
    isFinishPending,
    isCancelPending
}: ActiveWorkoutActionsProps) => {
    return (
        <div className="flex flex-col gap-2 mt-4">
            <Button 
                onClick={onFinishClick}
                disabled={isFinishPending || isCancelPending}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 text-lg rounded-xl shadow-md"
            >
                {isFinishPending ? "Finalizando..." : "Finalizar Treino"}
            </Button>

            <Button
                variant="ghost"
                onClick={onCancelClick}
                disabled={isFinishPending || isCancelPending}
                className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-10 font-medium rounded-xl transition-colors"
            >
                {isCancelPending ? "Cancelando..." : "Cancelar Treino"}
            </Button>
        </div>
    );
};
