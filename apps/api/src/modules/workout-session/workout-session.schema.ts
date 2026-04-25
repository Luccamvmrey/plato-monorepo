import { z } from "zod";

export const createWorkoutSessionSchema = z.object({
    workoutId: z.number().int().positive("Workout ID is required"),
});