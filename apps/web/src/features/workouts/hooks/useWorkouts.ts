import { useQuery } from "@tanstack/react-query";
import { WorkoutService } from "@/features/workouts/services/workout.service.ts";
import { useWorkoutEditorStore } from "@/features/workouts/stores/workout-editor.store.ts";
import { useAppMutation } from "@/core/hooks/useAppMutation";
import { WorkoutSessionService } from "../services/workout-session/workout-session.service";

export const useWorkouts = (id?: string, isActive?: boolean) => {
    const reset = useWorkoutEditorStore(state => state.reset);

    const userWorkoutsQuery = useQuery({
        queryKey: ["workouts", { isActive }],
        queryFn: () => WorkoutService.getUserWorkouts(isActive),
    });

    const lastCompletedSessionQuery = useQuery({
        queryKey: ["last-completed-session"],
        queryFn: async () => {
            const sessions = await WorkoutSessionService.getByUserId();
            return sessions.find(s => s.completedAt !== null) || null;
        }
    });

    const workoutByIdQuery = useQuery({
        queryKey: ["workout", id],
        queryFn: () => WorkoutService.getById(id!),
        enabled: !!id && id !== "new",
        staleTime: 0,
    });

    const createWorkoutMutation = useAppMutation({
        mutationFn: WorkoutService.create,
        invalidateQueries: [["workouts"]],
        successMessage: "Treino criado com sucesso!",
        errorMessage: "Erro ao criar treino. Tente novamente mais tarde."
    });

    const updateWorkoutMutation = useAppMutation({
        mutationFn: WorkoutService.update,
        invalidateQueries: [["workouts"]],
        successMessage: "Treino atualizado com sucesso!",
        errorMessage: "Erro ao atualizar treino. Tente novamente mais tarde."
    });

    const toggleStatusMutation = useAppMutation({
        mutationFn: WorkoutService.toggleStatus,
        invalidateQueries: [["workouts"]],
        successMessage: "Status do treino atualizado!",
        errorMessage: "Erro ao atualizar status do treino."
    });

    const deleteWorkoutMutation = useAppMutation({
        mutationFn: WorkoutService.delete,
        invalidateQueries: [["workouts"]],
        successMessage: "Treino deletado com sucesso!",
        errorMessage: "Erro ao deletar treino. Tente novamente mais tarde.",
        onSuccess: () => reset()
    })

    return {
        userWorkoutsQuery,
        lastCompletedSessionQuery,
        workoutByIdQuery,
        createWorkoutMutation,
        updateWorkoutMutation,
        deleteWorkoutMutation,
        toggleStatusMutation
    }
}