import { z } from "zod";

export const createShareSchema = z.object({
    kind: z.enum(["WORKOUT", "PROGRAM"]),
    sourceId: z.number().int().positive(),
});

export type CreateShareInput = z.infer<typeof createShareSchema>;
