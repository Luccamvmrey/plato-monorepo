import { z } from "zod";

export const createWorkoutExerciseSchema = z.object({
    exerciseId: z.number().int().positive("Exercise ID is required"),
    orderIndex: z.number().int().positive("Order index must be a positive integer"),
    targetSets: z.number().int().positive("Sets must be a positive integer"),
    targetReps: z.number().int().positive("Reps must be a positive integer"),
    observations: z.string().optional(),
});

// O update de treino é substituição completa (deleteMany + createMany), então cada
// item precisa vir inteiro — um item parcial não tem como virar linha no banco.
export const updateWorkoutExerciseSchema = createWorkoutExerciseSchema

export type CreateWorkoutExerciseInput = z.infer<typeof createWorkoutExerciseSchema>