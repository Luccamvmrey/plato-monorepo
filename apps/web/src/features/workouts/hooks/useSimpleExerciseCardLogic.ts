import { useSessionSet } from "@/features/workouts/hooks/useSessionSet";
import { useSessionPlanActions } from "@/features/workouts/hooks/useSessionPlanActions";
import { useExerciseWeightInput } from "@/features/workouts/hooks/useExerciseWeightInput";
import type { EnrichedExerciseRecord } from "@/features/workouts/workout.types";

export const useSimpleExerciseCardLogic = (record: EnrichedExerciseRecord, sessionId: number) => {
    const { confirmSet } = useSessionSet();
    const planActions = useSessionPlanActions(record, sessionId);
    const weight = useExerciseWeightInput(record);

    const activeSetNumber = record.logs.length + 1;
    const isLastSet = activeSetNumber >= record.effectiveTargetSets;
    const usesLoad = record.exercise.loadType !== "BODYWEIGHT";

    const handleDone = () => {
        confirmSet({
            workoutSessionId: sessionId,
            exerciseId: record.exerciseId,
            setNumber: activeSetNumber,
            // Presumidas: quem escolheu este modo não quer contar. É por isso que o
            // servidor deixa estas séries fora de PR, e1RM e progressão.
            actualReps: record.targetReps,
            actualWeight: usesLoad ? weight.parsed : null,
            rpe: null,
        }, record);
    };

    return {
        ...planActions,
        activeSetNumber,
        // Só na última série: é "peso ao fim do exercício". Depois disso a tela já rola
        // para o próximo, então um campo só no card concluído passaria despercebido.
        showWeight: isLastSet && usesLoad,
        weight,
        handleDone,
    };
};
