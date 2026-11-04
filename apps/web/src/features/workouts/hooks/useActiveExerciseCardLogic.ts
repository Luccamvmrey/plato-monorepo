import { useMemo, useState } from "react";
import { useSessionSet } from "@/features/workouts/hooks/useSessionSet";
import { useSessionPlanActions } from "@/features/workouts/hooks/useSessionPlanActions";
import { useActiveWorkoutStore } from "@/features/workouts/stores/active-workout.store";
import { buildAdviceChain } from "@/features/workouts/utils/progression";
import type { EnrichedExerciseRecord, ExerciseHistoryMap, SessionSet } from "@/features/workouts/workout.types";
import { type SetSubmissionData } from "@/features/workouts/hooks/useActiveSetInput";

export const useActiveExerciseCardLogic = (
    record: EnrichedExerciseRecord,
    sessionId: number,
    history?: ExerciseHistoryMap
) => {
    const { confirmSet } = useSessionSet();
    const planActions = useSessionPlanActions(record, sessionId);
    const [equipmentWeightVisible, setEquipmentWeightVisible] = useState<boolean | null>(null);

    const exerciseNotes = useActiveWorkoutStore((s) => s.activeSession?.exerciseNotes);
    const setExerciseNote = useActiveWorkoutStore((s) => s.setExerciseNote);
    const note = exerciseNotes?.[record.exerciseId] ?? "";
    const [noteVisible, setNoteVisible] = useState(() => !!note);

    const activeSetNumber = record.logs.length + 1;

    // Este card só aparece em sessão de registro completo, em que o servidor exige
    // peso e RPE. O filtro diz isso ao compilador sem afirmar nada por cast.
    const loggedSets = useMemo(
        () => record.logs.filter(
            (log): log is SessionSet & { actualWeight: number; rpe: number } =>
                log.actualWeight !== null && log.rpe !== null
        ),
        [record.logs],
    );

    // A prescrição é uma cadeia: o histórico dá o ponto de partida e cada set
    // registrado nesta sessão re-prescreve o seguinte. O índice i é o que valia para
    // o set i+1 — é isso que permite julgar o desvio de um set concluído contra a
    // prescrição daquele set, e não contra a corrente.
    const adviceChain = useMemo(
        () => buildAdviceChain(history?.[record.exerciseId] ?? [], record.targetReps, loggedSets),
        [history, record.exerciseId, record.targetReps, loggedSets],
    );
    const advice = adviceChain[adviceChain.length - 1];

    // A prescrição do set ativo já embute o último set registrado, inclusive a
    // ausência de barra (equipmentWeight null vira 0) — não há caso especial aqui.
    const seed = useMemo(() => ({
        weight:          advice.suggestedWeight,
        equipmentWeight: advice.suggestedEquipmentWeight,
        reps:            advice.suggestedReps,
    }), [advice]);

    const autoShowEquipmentWeight = (seed.equipmentWeight ?? 0) > 0 || record.logs.some(l => l.equipmentWeight);

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
            userObservation: note || undefined,
        }, record);
    };

    const toggleEquipmentWeight = () => {
        setEquipmentWeightVisible(prev => !(prev ?? autoShowEquipmentWeight));
    };

    const toggleNote = () => setNoteVisible(v => !v);
    const setNote = (text: string) => setExerciseNote(record.exerciseId, text);

    return {
        ...planActions,
        showEquipmentWeight,
        toggleEquipmentWeight,
        advice,
        adviceChain,
        seed,
        activeSetNumber,
        handleSetConfirm,
        isPending: false,
        noteVisible,
        toggleNote,
        note,
        setNote,
    };
};
