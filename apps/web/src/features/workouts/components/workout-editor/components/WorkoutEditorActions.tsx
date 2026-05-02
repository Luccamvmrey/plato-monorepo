import { Button } from "@/components/ui/button.tsx";
import { Check, Save } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkoutEditorActionsProps {
    formId: string;
    isSaving?: boolean;
    isSuccess?: boolean;
}

export const WorkoutEditorActions = ({ formId, isSaving, isSuccess }: WorkoutEditorActionsProps) => {
    return (
        <Button
            form={formId}
            variant="default"
            className={cn(
                "h-14 rounded-xl font-medium tracking-tight gap-2 transition-colors",
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
    );
};
