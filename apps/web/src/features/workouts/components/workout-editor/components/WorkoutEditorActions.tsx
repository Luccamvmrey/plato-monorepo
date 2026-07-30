import { Button } from "@/components/ui/button.tsx";
import { Check, Save } from "lucide-react";
import { useKeyboardOpen } from "@/core/hooks/useKeyboardOpen.ts";
import { cn } from "@/lib/utils";

interface WorkoutEditorActionsProps {
    formId: string;
    isSaving?: boolean;
    isSuccess?: boolean;
}

export const WorkoutEditorActions = ({ formId, isSaving, isSuccess }: WorkoutEditorActionsProps) => {
    const isKeyboardOpen = useKeyboardOpen();

    return (
        <div
            className={cn(
                // Mesmo padrão da ActiveWorkoutActions: fixa acima da NavBar. Em fluxo
                // normal este botão caía abaixo da dobra com 6 exercícios (y 856).
                "fixed bottom-navbar inset-x-0 p-4 pb-3 bg-background/95 backdrop-blur-sm border-t border-border",
                // Salvar nunca é a próxima ação no meio de um campo de séries/reps, e
                // com o teclado aberto esta faixa é justamente a região ocluída.
                isKeyboardOpen && "hidden"
            )}
        >
            <Button
                form={formId}
                variant="default"
                className={cn(
                    "w-full h-14 rounded-xl font-medium tracking-tight gap-2 transition-colors",
                    isSuccess && "bg-success text-success-foreground hover:bg-success/90"
                )}
                type="submit"
                disabled={isSaving || isSuccess}
            >
                {isSuccess ? (
                    <Check data-icon="inline-start" />
                ) : (
                    <Save data-icon="inline-start" />
                )}
                {isSaving ? "Salvando..." : isSuccess ? "Salvo!" : "Salvar Treino"}
            </Button>
        </div>
    );
};
