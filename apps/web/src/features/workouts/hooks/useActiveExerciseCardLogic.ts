import { useMemo, useState } from "react";
import { useSessionSet } from "@/features/workouts/hooks/useSessionSet";
import { useSessionExercises } from "@/features/workouts/hooks/useSessionExercises";
import { useActiveWorkoutStore } from "@/features/workouts/stores/active-workout.store";
import { buildAdviceChain } from "@/features/workouts/utils/progression";
import type { EnrichedExerciseRecord, Exercise, ExerciseHistoryMap } from "@/features/workouts/workout.types";
import { type SetSubmissionData } from "@/features/workouts/hooks/useActiveSetInput";

export const useActiveExerciseCardLogic = (
    record: EnrichedExerciseRecord,
    sessionId: number,
    history?: ExerciseHistoryMap
) => {
    const { confirmSet } = useSessionSet();
    const { substituteExerciseMutation, skipExerciseMutation } = useSessionExercises(sessionId);
    const [equipmentWeightVisible, setEquipmentWeightVisible] = useState<boolean | null>(null);
    const [alternativesOpen, setAlternativesOpen] = useState(false);

    const exerciseNotes = useActiveWorkoutStore((s) => s.activeSession?.exerciseNotes);
    const setExerciseNote = useActiveWorkoutStore((s) => s.setExerciseNote);
    const note = exerciseNotes?.[record.exerciseId] ?? "";
    const [noteVisible, setNoteVisible] = useState(() => !!note);

    const activeSetNumber = record.logs.length + 1;
    const pendingSetsCount = Math.max(0, record.effectiveTargetSets - activeSetNumber);

    // A prescrição é uma cadeia: o histórico dá o ponto de partida e cada set
    // registrado nesta sessão re-prescreve o seguinte. O índice i é o que valia para
    // o set i+1 — é isso que permite julgar o desvio de um set concluído contra a
    // prescrição daquele set, e não contra a corrente.
    const adviceChain = useMemo(
        () => buildAdviceChain(history?.[record.exerciseId] ?? [], record.targetReps, record.logs),
        [history, record.exerciseId, record.targetReps, record.logs],
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
        });
    };

    const toggleEquipmentWeight = () => {
        setEquipmentWeightVisible(prev => !(prev ?? autoShowEquipmentWeight));
    };

    const toggleNote = () => setNoteVisible(v => !v);
    const setNote = (text: string) => setExerciseNote(record.exerciseId, text);

    // Trocar e pular só existem com snapshot: em sessão legada não há SessionExercise
    // para referenciar no servidor, e a alternativa seria inventar um id.
    const canChangePlan = record.sessionExerciseId !== null;

    const handleSubstitute = (exercise: Exercise) => {
        if (!record.sessionExerciseId) return;

        substituteExerciseMutation.mutate(
            { sessionExerciseId: record.sessionExerciseId, exerciseId: exercise.id },
            { onSuccess: () => setAlternativesOpen(false) }
        );
    };

    const handleSkip = () => {
        if (!record.sessionExerciseId) return;

        skipExerciseMutation.mutate({ sessionExerciseId: record.sessionExerciseId, skipped: true });
    };

    return {
        canChangePlan,
        alternativesOpen,
        openAlternatives: () => setAlternativesOpen(true),
        closeAlternatives: () => setAlternativesOpen(false),
        handleSubstitute,
        handleSkip,
        isChangingPlan: substituteExerciseMutation.isPending || skipExerciseMutation.isPending,
        showEquipmentWeight,
        toggleEquipmentWeight,
        advice,
        adviceChain,
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
