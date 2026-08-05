import { useMemo, useState } from "react";
import { useSessionSet } from "@/features/workouts/hooks/useSessionSet";
import { useActiveWorkoutStore } from "@/features/workouts/stores/active-workout.store";
import { getProgressionAdvice } from "@/features/workouts/utils/progression";
import type { EnrichedExerciseRecord, ExerciseHistoryMap } from "@/features/workouts/workout.types";
import { type SetSubmissionData } from "@/features/workouts/hooks/useActiveSetInput";

export const useActiveExerciseCardLogic = (
    record: EnrichedExerciseRecord,
    sessionId: number,
    history?: ExerciseHistoryMap
) => {
    const { confirmSet } = useSessionSet();
    const [equipmentWeightVisible, setEquipmentWeightVisible] = useState<boolean | null>(null);

    const exerciseNotes = useActiveWorkoutStore((s) => s.activeSession?.exerciseNotes);
    const setExerciseNote = useActiveWorkoutStore((s) => s.setExerciseNote);
    const note = exerciseNotes?.[record.exerciseId] ?? "";
    const [noteVisible, setNoteVisible] = useState(() => !!note);

    const activeSetNumber = record.logs.length + 1;
    const pendingSetsCount = Math.max(0, record.effectiveTargetSets - activeSetNumber);

    // A prescrição olha só o histórico e não muda durante a sessão — reavaliá-la ao
    // vivo trocaria o veredito debaixo do usuário no meio do exercício.
    const advice = useMemo(
        () => getProgressionAdvice(history?.[record.exerciseId] ?? [], record.targetReps),
        [history, record.exerciseId, record.targetReps],
    );

    // O que semeia os inputs NÃO é a prescrição pura: se o usuário já registrou uma
    // série deste exercício nesta sessão, a próxima nasce com o que ele acabou de
    // fazer. Re-sugerir um peso que ele acabou de rejeitar seria uma regressão.
    // Comparações com != null e não truthiness — 0 kg (peso corporal, máquina
    // assistida) é uma carga legítima.
    const lastLog = record.logs[record.logs.length - 1];
    const seed = useMemo(() => ({
        weight:          lastLog?.actualWeight ?? advice.suggestedWeight,
        // Quando há set nesta sessão ele manda inteiro, inclusive a ausência de barra
        // (equipmentWeight null) — cair de volta na prescrição aqui traria a barra de volta.
        equipmentWeight: lastLog ? (lastLog.equipmentWeight ?? 0) : advice.suggestedEquipmentWeight,
        reps:            advice.suggestedReps,
    }), [lastLog, advice]);

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
        });
    };

    const toggleEquipmentWeight = () => {
        setEquipmentWeightVisible(prev => !(prev ?? autoShowEquipmentWeight));
    };

    const toggleNote = () => setNoteVisible(v => !v);
    const setNote = (text: string) => setExerciseNote(record.exerciseId, text);

    return {
        showEquipmentWeight,
        toggleEquipmentWeight,
        advice,
        seed,
        activeSetNumber,
        pendingSetsCount,
        handleSetConfirm,
        isPending: false,
        noteVisible,
        toggleNote,
        note,
        setNote,
    };
};
