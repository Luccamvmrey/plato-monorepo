import { useWorkoutEditorStore } from "@/features/workouts/stores/workout-editor.store.ts";

export const useExerciseListLogic = () => {
    const exercises = useWorkoutEditorStore(state => state.exercises);
    return { exercises };
};
