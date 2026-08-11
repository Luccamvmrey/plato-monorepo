import { z } from "zod";

/**
 * Faixa plausível em kg. Não é validação médica — é uma trava contra erro de
 * digitação, do mesmo tipo que produziu uma série de 1000 kg em Paralelas.
 */
const MIN_WEIGHT = 20;
const MAX_WEIGHT = 400;

export const createBodyWeightSchema = z.object({
    weight: z.number()
        .positive("Weight must be positive")
        .min(MIN_WEIGHT, `Weight must be at least ${MIN_WEIGHT} kg`)
        .max(MAX_WEIGHT, `Weight must be at most ${MAX_WEIGHT} kg`),
    // Ausente significa "agora". O cliente pode enviar data passada para registrar
    // retroativamente, que é o caso de uso para corrigir histórico.
    measuredAt: z.coerce.date().optional(),
});

export type CreateBodyWeightInput = z.infer<typeof createBodyWeightSchema>;
