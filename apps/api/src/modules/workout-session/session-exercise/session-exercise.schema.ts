import { z } from "zod";

/**
 * `targetSets`/`targetReps` são opcionais: um exercício adicionado no meio do treino
 * raramente tem prescrição pensada. Sem eles, o service herda a prescrição do
 * exercício substituído (na troca) ou usa um default explícito (no ad-hoc).
 */
export const addSessionExerciseSchema = z.object({
    exerciseId: z.number().int().positive("Exercise ID is required"),
    targetSets: z.number().int().positive().max(20).optional(),
    targetReps: z.number().int().positive().max(200).optional(),
    observation: z.string().optional(),
});

export const substituteSessionExerciseSchema = z.object({
    exerciseId: z.number().int().positive("Exercise ID is required"),
});

export const skipSessionExerciseSchema = z.object({
    skipped: z.boolean(),
});

export type AddSessionExerciseInput = z.infer<typeof addSessionExerciseSchema>;
export type SubstituteSessionExerciseInput = z.infer<typeof substituteSessionExerciseSchema>;
export type SkipSessionExerciseInput = z.infer<typeof skipSessionExerciseSchema>;
