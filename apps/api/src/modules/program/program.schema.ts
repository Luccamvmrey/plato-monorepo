import { z } from "zod";

const workoutIds = z
    .array(z.number().int().positive())
    .nonempty("At least one workout is required")
    .refine((ids) => new Set(ids).size === ids.length, "A workout cannot appear twice in the same program");

export const createProgramSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    /// A ordem do array É a ordem da rotação. `orderIndex` é derivado da posição,
    /// nunca enviado pelo cliente — evita buraco e empate no índice.
    workoutIds,
});

// Não é `.partial()`: o update substitui a lista inteira (deleteMany + createMany),
// então uma lista ausente não teria como virar "manter o que está lá".
export const updateProgramSchema = z.object({
    name: z.string().min(1, "Name is required").optional(),
    description: z.string().optional(),
    workoutIds,
});

export type CreateProgramInput = z.infer<typeof createProgramSchema>;
export type UpdateProgramInput = z.infer<typeof updateProgramSchema>;
