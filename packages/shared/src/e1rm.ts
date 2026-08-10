/**
 * 1RM estimado pela fórmula de Brzycki, ajustada por RPE.
 *
 * RPE (1-10) se relaciona inversamente com RIR (repetições em reserva):
 *   RIR = 10 - RPE
 *   reps ajustadas = reps + RIR
 *   1RM = carga * (36 / (37 - reps ajustadas))
 *
 * Brzycki é mais preciso abaixo de 10 repetições. A fórmula tem singularidade em
 * 37 repetições ajustadas, daí o teto em 36.
 */
export const calculateE1RM = (
    weight: number,
    reps: number,
    rpe: number,
    equipmentWeight: number = 0
): number => {
    const rir = 10 - rpe;
    const effectiveReps = reps + rir;
    const cappedReps = Math.min(effectiveReps, 36);

    return (weight + equipmentWeight) * (36 / (37 - cappedReps));
};
