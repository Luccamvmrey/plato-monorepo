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
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
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