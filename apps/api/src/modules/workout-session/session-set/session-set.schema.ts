import { z } from "zod";

export const createSessionSetSchema = z.object({
    workoutSessionId: z.number().int().positive("Workout Session ID is required"),
    exerciseId: z.number().int().positive("Exercise ID is required"),
    setNumber: z.number().int().positive("Set number is required"),
    actualReps: z.number().int().nonnegative("Actual reps must is required"),
    actualWeight: z.number().nonnegative("Actual weight must is required"),
    equipmentWeight: z.number().int().nonnegative().optional(),
    rpe: z.number().int().positive("RPE must is required").lte(10, "RPE must be between 1 and 10"),
});

export const updateSessionSetSchema = createSessionSetSchema.omit({
    workoutSessionId: true,
    exerciseId: true
}).partial();