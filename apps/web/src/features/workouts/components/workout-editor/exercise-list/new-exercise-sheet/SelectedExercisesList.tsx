import type { Exercise } from "@/features/workouts/workout.types.ts";
import { Badge } from "@/components/ui/badge.tsx";
import { X } from "lucide-react";

type SelectedExercisesListProps = {
    selectedExercises: Exercise[];
    onExerciseClick: (exercise: Exercise) => void;
};

const SelectedExercisesList = ({ selectedExercises, onExerciseClick }: SelectedExercisesListProps) => {
    if (selectedExercises.length === 0) return null;

    return (
        // shrink-0 é obrigatório: `overflow-x-auto` faz desta linha um scroll container,
        // cujo tamanho mínimo automático é 0 (e não o do conteúdo). Como irmã de uma
        // lista muito mais alta que a viewport dentro de um flex-col, ela era esmagada
        // para height:0 e os chips ficavam invisíveis — nunca apareceram, nem antes.
        <div className="flex gap-2 overflow-x-auto no-scrollbar shrink-0">
            {selectedExercises.map((exercise) => (
                <Badge key={exercise.id} onClick={() => onExerciseClick(exercise)}>
                    {exercise.name}
                    <X/>
                </Badge>
            ))}
        </div>
    );
};

export default SelectedExercisesList;