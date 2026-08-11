import { useQuery } from "@tanstack/react-query";
import { SessionExerciseService } from "@/features/workouts/services/workout-session/session-exercise.service.ts";

/**
 * Histórico recente de todos os exercícios DA SESSÃO, num único fetch.
 *
 * Um fetch por exercício reintroduziria a corrida que quebrava o prefill (o input
 * inicializava antes do dado chegar); buscar o mapa inteiro no início da sessão
 * elimina isso na raiz.
 *
 * Passou a ser resolvido pela sessão e não pelo treino porque o exercício adicionado
 * fora do plano não pertence ao treino: o escopo por treino devolveria vazio para ele,
 * e o card nasceria sem carga de referência. Para o que foi prescrito, o servidor
 * mantém o escopo por treino — a decisão de que o mesmo exercício progride separado em
 * treinos diferentes continua valendo.
 *
 * staleTime: Infinity é deliberado — nada dentro da sessão altera sessões já
 * concluídas, e um refetch no meio do treino trocaria a prescrição debaixo do usuário.
 * A invalidação acontece ao finalizar e ao mudar o plano da sessão (trocar/adicionar).
 */
export const useExerciseHistory = (sessionId?: number) => {
    return useQuery({
        queryKey: ["session-exercise-history", sessionId],
        queryFn: () => SessionExerciseService.getExerciseHistory(sessionId!),
        enabled: !!sessionId,
        staleTime: Infinity,
    });
};
