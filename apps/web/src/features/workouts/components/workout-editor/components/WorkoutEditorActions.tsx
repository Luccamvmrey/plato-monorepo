import { Button } from "@/components/ui/button.tsx";
import { Save } from "lucide-react";

interface WorkoutEditorActionsProps {
    formId: string;
    isSaving?: boolean;
}

export const WorkoutEditorActions = ({ formId, isSaving }: WorkoutEditorActionsProps) => {
    return (
        <Button 
            form={formId} 
            variant="default"
            className="h-14 rounded-xl font-medium tracking-tight gap-2" 
            type="submit"
            disabled={isSaving}
        >
            <Save data-icon="inline-start" />
            {isSaving ? "Salvando..." : "Salvar Treino"}
        </Button>
    );
};
