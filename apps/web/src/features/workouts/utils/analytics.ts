import type { SessionSet } from "../workout.types";

/**
 * Calculates Estimated 1RM using the Brzycki formula, adjusted for RPE.
 * 
 * Logic:
 * RPE (Rate of Perceived Exertion) on a scale of 1-10 relates inversely to Reps in Reserve (RIR).
 * RIR = 10 - RPE.
 * Adjusted Reps = Actual Reps + RIR.
 * Formula: 1RM = Weight * (36 / (37 - Adjusted Reps))
 * 
 * Note: Brzycki is most accurate for reps < 10.
 */
export const calculateE1RM = (weight: number, reps: number, rpe: number, equipmentWeight: number = 0): number => {
    const rir = 10 - rpe;
    const effectiveReps = reps + rir;
    
    // Brzycki formula has a singularity at reps = 37, but practically effectiveReps should be low.
    // If effectiveReps >= 37, the formula breaks. We'll cap it at 36 for safety.
    const cappedReps = Math.min(effectiveReps, 36);
    
    return (weight + equipmentWeight) * (36 / (37 - cappedReps));
};

/**
 * Calculates Volume (Tonnage) for a single set.
 */
export const calculateSetVolume = (weight: number, reps: number, equipmentWeight: number = 0): number => {
    return (weight + equipmentWeight) * reps;
};

/**
 * Calculates Total Work Volume (VTT) for a collection of sets.
 */
export const calculateTotalVolume = (sets: SessionSet[]): number => {
    return sets.reduce((total, set) => 
        total + calculateSetVolume(set.actualWeight, set.actualReps, set.equipmentWeight || 0), 0
    );
};

/**
 * Calculates the average RPE for a collection of sets.
 */
export const calculateAverageRPE = (sets: SessionSet[]): number => {
    if (sets.length === 0) return 0;
    const sum = sets.reduce((total, set) => total + set.rpe, 0);
    return sum / sets.length;
};
