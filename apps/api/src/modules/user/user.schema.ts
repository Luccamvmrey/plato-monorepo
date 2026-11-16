import { z } from "zod";

export const updateBetaSchema = z.object({ enabled: z.boolean() });

export type UpdateBetaInput = z.infer<typeof updateBetaSchema>;
