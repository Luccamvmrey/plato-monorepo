import { useState } from "react";
import { parseDecimalPtBr } from "@/core/utils/formatters";
import { useActiveWorkoutStore } from "@/features/workouts/stores/active-workout.store";
import { formatWeightPtBr } from "@/features/workouts/utils/progression";
import type { EnrichedExerciseRecord } from "@/features/workouts/workout.types";

/** O menor salto comum entre anilhas. */
export const WEIGHT_STEP = 2.5;

/** Vazio ou inválido é "não informado", nunca 0: 0 kg é uma carga de verdade. */
const parseOptionalWeight = (value: string): number | null =>
    /^\d+([.,]\d*)?$/.test(value.trim()) ? parseDecimalPtBr(value.trim()) : null;

/** O peso único e opcional de um exercício no modo simplificado. */
export const useExerciseWeightInput = (record: EnrichedExerciseRecord, lastWeight?: number) => {
    const setExerciseWeight = useActiveWorkoutStore((s) => s.setExerciseWeight);

    const [value, setValue] = useState(() => {
        const current = record.logs[0]?.actualWeight;
        return current != null ? formatWeightPtBr(current) : "";
    });

    const handleChange = (next: string) => {
        setValue(next);
        setExerciseWeight(record.exerciseId, parseOptionalWeight(next));
    };

    const parsed = parseOptionalWeight(value);

    // Sem nada digitado, os botões partem do peso da última vez, não de zero.
    const handleStep = (delta: number) => {
        const next = Math.max(0, (parsed ?? lastWeight ?? 0) + delta);
        handleChange(formatWeightPtBr(next));
    };

    const handleRepeat = () => {
        if (lastWeight !== undefined) handleChange(formatWeightPtBr(lastWeight));
    };

    return { value, parsed, handleChange, handleStep, handleRepeat };
};
