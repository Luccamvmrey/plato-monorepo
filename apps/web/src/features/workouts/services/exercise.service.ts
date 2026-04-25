import api from "@/core/api";
import type { Exercise } from "@/features/workouts/workout.types.ts";

export const ExerciseService = {
    getExercises: async () => {
        const { data } = await api.get<Exercise[]>("/exercises");
        return data;
    }
}