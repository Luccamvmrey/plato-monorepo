import { useState } from "react";
import { useSessionSet } from "@/features/workouts/hooks/useSessionSet";
import { useExerciseSuggestions } from "@/features/workouts/hooks/useExerciseSuggestions";
import type { EnrichedExerciseRecord, WorkoutSession } from "@/features/workouts/workout.types";
import { type SetSubmissionData } from "@/features/workouts/components/active-workout/exercise-stack/records/ActiveSetInputRow";

export const useActiveExerciseCardLogic = (
    record: EnrichedExerciseRecord,
    sessionId: number,
    lastSession?: WorkoutSession | null
) => {
    const { confirmSet } = useSessionSet();
    const [equipmentWeightVisible, setEquipmentWeightVisible] = useState<boolean | null>(null);

    const { suggestions, activeSetNumber, pendingSetsCount, autoShowEquipmentWeight } = useExerciseSuggestions(
        record,
        lastSession,
    );

    // null = follow auto-detection; true/false = explicit user override
    const showEquipmentWeight = equipmentWeightVisible ?? autoShowEquipmentWeight;

    const handleSetConfirm = (setNumber: number, data: SetSubmissionData) => {
        confirmSet({
            workoutSessionId: sessionId,
            exerciseId: record.exerciseId,
            setNumber: setNumber,
            actualReps: data.actualReps,
            actualWeight: data.actualWeight,
            rpe: data.rpe,
            equipmentWeight: data.equipmentWeight,
        });
    };

    const toggleEquipmentWeight = () => {
        setEquipmentWeightVisible(prev => !(prev ?? autoShowEquipmentWeight));
    };

    return {
        showEquipmentWeight,
        toggleEquipmentWeight,
        suggestions,
        activeSetNumber,
        pendingSetsCount,
        handleSetConfirm,
        isPending: false,
    };
};
