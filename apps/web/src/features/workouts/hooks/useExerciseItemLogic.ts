import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useWorkoutEditorStore, type WorkoutExerciseDraft } from "@/features/workouts/stores/workout-editor.store";

export const useExerciseItemLogic = (exercise: WorkoutExerciseDraft) => {
    const updateExerciseField = useWorkoutEditorStore(state => state.updateExerciseField);
    const removeExercise = useWorkoutEditorStore(state => state.removeExercise);

    const onEditSets = (instanceId: string, sets: number) => {
        updateExerciseField(instanceId, "targetSets", sets);
    };

    const onEditReps = (instanceId: string, reps: number) => {
        updateExerciseField(instanceId, "targetReps", reps);
    };

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: exercise.instanceId });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition
    };

    return {
        onEditSets,
        onEditReps,
        removeExercise,
        attributes,
        listeners,
        setNodeRef,
        style,
        isDragging,
    };
};
