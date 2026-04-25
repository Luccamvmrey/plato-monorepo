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
            className="py-6 rounded-xl" 
            type="submit"
            disabled={isSaving}
        >
            <Save />
            {isSaving ? "Salvando..." : "Salvar Treino"}
        </Button>
    );
};
