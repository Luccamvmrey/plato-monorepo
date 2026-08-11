import api from "@/core/api";
import type { Exercise, ExerciseAlternatives } from "@/features/workouts/workout.types.ts";

export const ExerciseService = {
    getExercises: async () => {
        const { data } = await api.get<Exercise[]>("/exercises");
        return data;
    },

    getAlternatives: async (exerciseId: number) => {
        const { data } = await api.get<ExerciseAlternatives>(`/exercises/${exerciseId}/alternatives`);
        return data;
    }
}
