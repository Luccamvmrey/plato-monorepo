import { z } from "zod";
import { createWorkoutExerciseSchema, updateWorkoutExerciseSchema } from "./workout-exercise/workout-exercise.schema";

export const createWorkoutSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    exercises: z.array(createWorkoutExerciseSchema).nonempty("At least one exercise is required"),
});

export const updateWorkoutSchema = z.object({
    name: z.string().min(1, "Name is required").optional(),
    description: z.string().optional(),
    exercises: z.array(updateWorkoutExerciseSchema).nonempty("At least one exercise is required"),
});