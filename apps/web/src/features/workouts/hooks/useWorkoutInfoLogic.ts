import { useLocation, useParams } from "wouter";
import { useWorkoutEditorStore } from "@/features/workouts/stores/workout-editor.store";
import { useWorkouts } from "@/features/workouts/hooks/useWorkouts";
import { path } from "@/core/constants/path";

export const useWorkoutInfoLogic = () => {
    const { id } = useParams();
    const navigate = useLocation()[1];

    const { deleteWorkoutMutation } = useWorkouts(id);

    const name = useWorkoutEditorStore(state => state.name);
    const description = useWorkoutEditorStore(state => state.description);
    const setWorkoutInfo = useWorkoutEditorStore(state => state.setWorkoutInfo);
    const reset = useWorkoutEditorStore(state => state.reset);

    const title = id === "new" ? "Novo" : "Editar";

    const handleBack = () => {
        reset();
        navigate(path.WORKOUTS);
    };

    const handleDelete = async () => {
        if (id === "new" || !id) return;

        deleteWorkoutMutation.mutate(id);
        navigate(path.WORKOUTS);
    };

    return {
        id,
        title,
        name,
        description,
        setWorkoutInfo,
        handleBack,
        handleDelete,
    };
};
