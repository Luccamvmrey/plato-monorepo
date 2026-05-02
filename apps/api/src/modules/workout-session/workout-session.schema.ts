import { z } from "zod";

export const createWorkoutSessionSchema = z.object({
    workoutId: z.number().int().positive("Workout ID is required"),
});

export const finishSessionSchema = z.object({
    sets: z.array(z.object({
        workoutSessionId: z.number().int().positive(),
        exerciseId:       z.number().int().positive(),
        setNumber:        z.number().int().positive(),
        actualReps:       z.number().int().nonnegative(),
        actualWeight:     z.number().nonnegative(),
        equipmentWeight:  z.number().nonnegative().optional(),
        rpe:              z.number().min(1).max(10),
    }))
});
