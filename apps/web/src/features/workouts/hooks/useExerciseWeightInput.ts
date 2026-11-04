import { useState } from "react";
import { parseDecimalPtBr } from "@/core/utils/formatters";
import { useActiveWorkoutStore } from "@/features/workouts/stores/active-workout.store";
import type { EnrichedExerciseRecord } from "@/features/workouts/workout.types";

/** Vazio ou inválido é "não informado", nunca 0: 0 kg é uma carga de verdade. */
const parseOptionalWeight = (value: string): number | null =>
    /^\d+([.,]\d*)?$/.test(value.trim()) ? parseDecimalPtBr(value.trim()) : null;

/** O peso único e opcional de um exercício no modo simplificado. */
export const useExerciseWeightInput = (record: EnrichedExerciseRecord) => {
    const setExerciseWeight = useActiveWorkoutStore((s) => s.setExerciseWeight);

    const [value, setValue] = useState(() => {
        const current = record.logs[0]?.actualWeight;
        return current != null ? String(current).replace(".", ",") : "";
    });

    const handleChange = (next: string) => {
        setValue(next);
        setExerciseWeight(record.exerciseId, parseOptionalWeight(next));
    };

    return { value, parsed: parseOptionalWeight(value), handleChange };
};
