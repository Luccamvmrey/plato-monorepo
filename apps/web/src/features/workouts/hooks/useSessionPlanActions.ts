import { useState } from "react";
import { useSessionExercises } from "@/features/workouts/hooks/useSessionExercises";
import type { EnrichedExerciseRecord, Exercise } from "@/features/workouts/workout.types";

/** Trocar e pular o exercício durante a sessão, nos dois modos de registro. */
export const useSessionPlanActions = (record: EnrichedExerciseRecord, sessionId: number) => {
    const { substituteExerciseMutation, skipExerciseMutation } = useSessionExercises(sessionId);
    const [alternativesOpen, setAlternativesOpen] = useState(false);

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
    };
};
