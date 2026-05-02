import { useState } from "react";
import { useSessionSet } from "@/features/workouts/hooks/useSessionSet";
import { useExerciseSuggestions } from "@/features/workouts/hooks/useExerciseSuggestions";
import type { EnrichedExerciseRecord, WorkoutSession } from "@/features/workouts/workout.types";
import { type SetSubmissionData } from "@/features/workouts/components/active-workout/exercise-stack/records/ActiveSetInputRow";

export const useActiveExerciseCardLogic = (
    record: EnrichedExerciseRecord,
    sessionId: number,
    lastSession?: WorkoutSession | null,
    isReadOnly: boolean = false
) => {
    const { confirmSet } = useSessionSet();
    const [showEquipmentWeight, setShowEquipmentWeight] = useState(false);

    const { suggestions, activeSetNumber, pendingSetsCount } = useExerciseSuggestions(
        record,
        lastSession,
        showEquipmentWeight,
        setShowEquipmentWeight
    );

    const handleSetConfirm = (setNumber: number, data: SetSubmissionData) => {
        if (isReadOnly) return;
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
        setShowEquipmentWeight(prev => !prev);
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
