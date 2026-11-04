import { useSessionSet } from "@/features/workouts/hooks/useSessionSet";
import { useSessionPlanActions } from "@/features/workouts/hooks/useSessionPlanActions";
import { useExerciseWeightInput } from "@/features/workouts/hooks/useExerciseWeightInput";
import { useActiveWorkoutStore } from "@/features/workouts/stores/active-workout.store";
import { UNITS } from "@/core/constants/units";
import type { EnrichedExerciseRecord } from "@/features/workouts/workout.types";

/** "10 reps" ou "30 s": prancha e afins são medidas em segundos. */
export const repLabelFor = (record: EnrichedExerciseRecord) =>
    record.exercise.repUnit === "SECONDS"
        ? `${record.targetReps} s`
        : `${record.targetReps} ${UNITS.REPS}s`;

export const useSimpleExerciseCardLogic = (
    record: EnrichedExerciseRecord,
    sessionId: number,
    lastWeight?: number,
) => {
    const { confirmSet } = useSessionSet();
    const undoLastSet = useActiveWorkoutStore((s) => s.undoLastSet);
    const planActions = useSessionPlanActions(record, sessionId);
    const weight = useExerciseWeightInput(record, lastWeight);

    const activeSetNumber = record.logs.length + 1;
    const isLastSet = activeSetNumber >= record.effectiveTargetSets;
    const usesLoad = record.exercise.loadType !== "BODYWEIGHT";

    const handleDone = () => {
        // Sem olhar para a tela, a vibração é o que confirma que o toque pegou.
        navigator.vibrate?.(15);

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
        repLabel: repLabelFor(record),
        // Só na última série: é "peso ao fim do exercício". Depois disso a tela já rola
        // para o próximo, então um campo só no card concluído passaria despercebido.
        showWeight: isLastSet && usesLoad,
        weight,
        handleDone,
        // Com um toque por série, um toque errado precisa ter volta.
        handleUndo: () => undoLastSet(record.exerciseId),
    };
};
