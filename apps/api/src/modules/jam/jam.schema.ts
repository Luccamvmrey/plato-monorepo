import { z } from "zod";

export const createJamSchema = z.object({
    workoutId: z.number().int().positive(),
});

/** Sem `workoutId`, quem entra recebe uma cópia do treino do host. */
export const joinJamSchema = z.object({
    workoutId: z.number().int().positive().optional(),
});

export const jamPresenceSchema = z.object({
    exerciseId: z.number().int().positive().nullable(),
    /** Epoch em ms, no relógio do aparelho. */
    restEndsAt: z.number().int().positive().nullable(),
});

export const jamModeSchema = z.object({
    mode: z.enum(["PARALLEL", "ALTERNATE"]),
});

export type CreateJamInput = z.infer<typeof createJamSchema>;
export type JoinJamInput = z.infer<typeof joinJamSchema>;
export type JamPresenceInput = z.infer<typeof jamPresenceSchema>;
export type JamModeInput = z.infer<typeof jamModeSchema>;
