import { z } from "zod";
import { createWorkoutExerciseSchema, updateWorkoutExerciseSchema } from "./workout-exercise/workout-exercise.schema";

const trackingModeSchema = z.enum(["FULL", "SIMPLE"]);

export const createWorkoutSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    trackingMode: trackingModeSchema.optional(),
    exercises: z.array(createWorkoutExerciseSchema).nonempty("At least one exercise is required"),
});

export const updateWorkoutSchema = z.object({
    name: z.string().min(1, "Name is required").optional(),
    description: z.string().optional(),
    trackingMode: trackingModeSchema.optional(),
    exercises: z.array(updateWorkoutExerciseSchema).nonempty("At least one exercise is required"),
});

export type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>
export type UpdateWorkoutInput = z.infer<typeof updateWorkoutSchema>