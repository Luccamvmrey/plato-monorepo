import { z } from "zod";

const MUSCLE_GROUPS = [
    "CHEST",
    "SHOULDERS",
    "TRICEPS",

    "BACK",
    "BICEPS",
    "FOREARMS",
    "TRAPS",

    "QUADRICEPS",
    "HAMSTRINGS",
    "GLUTES",
    "CALVES",

    "CORE",
    "LOWER_BACK",
    "NECK"
] as const;

export const createExerciseSchema = z.object({
    name: z.string().min(2, "Exercise name is required"),
    targetMuscle: z.enum(MUSCLE_GROUPS),
    secondaryMuscles: z.array(z.enum(MUSCLE_GROUPS)).optional().default([]),
});

export const bulkCreateExerciseSchema = z.object({
    exercises: z.array(createExerciseSchema).min(1),
});