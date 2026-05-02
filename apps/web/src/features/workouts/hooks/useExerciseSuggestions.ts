import { useMemo } from "react";
import type { EnrichedExerciseRecord, WorkoutSession } from "@/features/workouts/workout.types.ts";

export const useExerciseSuggestions = (
    record: EnrichedExerciseRecord,
    lastSession: WorkoutSession | null | undefined,
) => {
    const activeSetNumber = record.logs.length + 1;

    const suggestions = useMemo(() => {
        let weight: number | undefined = undefined;
        let equipWeight: number | undefined = undefined;

        // 1. Se já fez uma série neste treino, usa o peso da última série feita
        if (record.logs.length > 0) {
            const lastLog = record.logs[record.logs.length - 1];
            weight = lastLog.actualWeight;
            equipWeight = lastLog.equipmentWeight || undefined;
        }
        // 2. Se não fez nenhuma série, busca no histórico do último treino
        else if (lastSession) {
            const lastSessionExerciseSets = lastSession.sessionSet.filter(s => s.exerciseId === record.exerciseId);
            const matchingSet = lastSessionExerciseSets.find(s => s.setNumber === activeSetNumber);
            const fallbackSet = lastSessionExerciseSets[lastSessionExerciseSets.length - 1];

            weight = matchingSet?.actualWeight || fallbackSet?.actualWeight;
            equipWeight = (matchingSet?.equipmentWeight || fallbackSet?.equipmentWeight) || undefined;
        }

        return { weight, equipWeight };
    }, [record.logs, lastSession, record.exerciseId, activeSetNumber]);

    const autoShowEquipmentWeight = !!suggestions.equipWeight || record.logs.some(l => l.equipmentWeight);

    return {
        suggestions,
        activeSetNumber,
        pendingSetsCount: Math.max(0, record.targetSets - activeSetNumber),
        autoShowEquipmentWeight,
    };
};
