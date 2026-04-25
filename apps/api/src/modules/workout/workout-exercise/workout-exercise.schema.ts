import { z } from "zod";

export const createWorkoutExerciseSchema = z.object({
    exerciseId: z.number().int().positive("Exercise ID is required"),
    orderIndex: z.number().int().positive("Order index must be a positive integer"),
    targetSets: z.number().int().positive("Sets must be a positive integer"),
    targetReps: z.number().int().positive("Reps must be a positive integer"),
    observations: z.string().optional(),
});

export const updateWorkoutExerciseSchema = createWorkoutExerciseSchema.partial()