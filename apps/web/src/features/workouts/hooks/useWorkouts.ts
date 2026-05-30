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
        queryKey: ["sessions"],
        queryFn: () => WorkoutSessionService.getByUserId(),
        select: (sessions) => sessions.find(s => s.completedAt !== null) ?? null,
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
        suppressDefaultError: true,
    });

    const updateWorkoutMutation = useAppMutation({
        mutationFn: WorkoutService.update,
        invalidateQueries: [["workouts"]],
        suppressDefaultError: true,
    });

    const toggleStatusMutation = useAppMutation({
        mutationFn: WorkoutService.toggleStatus,
        invalidateQueries: [["workouts"]],
    });

    const deleteWorkoutMutation = useAppMutation({
        mutationFn: WorkoutService.delete,
        invalidateQueries: [["workouts"]],
        onSuccess: () => reset()
    });

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
