import { useQuery } from "@tanstack/react-query";
import { ExerciseService } from "@/features/workouts/services/exercise.service.ts";

export const useExercises = () => {
    const exercisesQuery = useQuery({
        queryKey: ["exercises"],
        queryFn: ExerciseService.getExercises,
    });

    return {
        exercisesQuery
    };
}