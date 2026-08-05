import { useQuery } from "@tanstack/react-query";
import { WorkoutSessionService } from "@/features/workouts/services/workout-session/workout-session.service";

/**
 * Histórico recente de TODOS os exercícios do treino, num único fetch por sessão.
 *
 * Um fetch por exercício reintroduziria a corrida que quebrava o prefill (o input
 * inicializava antes do dado chegar); buscar o mapa inteiro no início da sessão
 * elimina isso na raiz.
 *
 * staleTime: Infinity é deliberado — nada dentro da sessão ativa altera sessões já
 * concluídas, e um refetch no meio do treino trocaria a prescrição debaixo do
 * usuário. A invalidação acontece só ao finalizar a sessão.
 */
export const useExerciseHistory = (workoutId?: number) => {
    return useQuery({
        queryKey: ["exercise-history", workoutId],
        queryFn: () => WorkoutSessionService.getExerciseHistory(workoutId!),
        enabled: !!workoutId,
        staleTime: Infinity,
    });
};
