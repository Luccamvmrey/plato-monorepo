import { useAppMutation } from "@/core/hooks/useAppMutation";
import { SessionExerciseService } from "@/features/workouts/services/workout-session/session-exercise.service.ts";

/**
 * Mudanças de plano dentro da sessão ativa.
 *
 * Todas invalidam `["activeSession"]`, que é de onde a pilha lê o snapshot, e
 * `["session-exercise-history"]`, porque adicionar ou trocar um exercício muda o
 * conjunto cujo histórico alimenta a prescrição — um exercício ad-hoc recém-incluído
 * precisa do histórico global dele para o card não nascer sem carga de referência.
 */
const SESSION_KEYS = [["activeSession"], ["session-exercise-history"]];

export const useSessionExercises = (sessionId?: number) => {
    const addExerciseMutation = useAppMutation({
        mutationFn: (exerciseId: number) =>
            SessionExerciseService.add(sessionId!, { exerciseId }),
        invalidateQueries: SESSION_KEYS,
    });

    const substituteExerciseMutation = useAppMutation({
        mutationFn: ({ sessionExerciseId, exerciseId }: { sessionExerciseId: number; exerciseId: number }) =>
            SessionExerciseService.substitute(sessionId!, sessionExerciseId, exerciseId),
        invalidateQueries: SESSION_KEYS,
    });

    const skipExerciseMutation = useAppMutation({
        mutationFn: ({ sessionExerciseId, skipped }: { sessionExerciseId: number; skipped: boolean }) =>
            SessionExerciseService.setSkipped(sessionId!, sessionExerciseId, skipped),
        invalidateQueries: SESSION_KEYS,
    });

    const removeExerciseMutation = useAppMutation({
        mutationFn: (sessionExerciseId: number) =>
            SessionExerciseService.remove(sessionId!, sessionExerciseId),
        invalidateQueries: SESSION_KEYS,
    });

    return {
        addExerciseMutation,
        substituteExerciseMutation,
        skipExerciseMutation,
        removeExerciseMutation,
        isMutating:
            addExerciseMutation.isPending ||
            substituteExerciseMutation.isPending ||
            skipExerciseMutation.isPending ||
            removeExerciseMutation.isPending,
    };
};
