import { useQuery } from "@tanstack/react-query";
import api from "@/core/api";
import { useAppMutation } from "@/core/hooks/useAppMutation";

export interface BodyWeightLog {
    id: number;
    userId: number;
    weight: number;
    measuredAt: string;
}

export interface CreateBodyWeightPayload {
    weight: number;
    measuredAt?: string;
}

export const BODY_WEIGHT_QUERY_KEY = ["body-weight"];

/**
 * Histórico de peso corporal. A API devolve do mais recente para o mais antigo,
 * então o primeiro item é o peso vigente.
 *
 * Isto não é preferência de exibição: os exercícios de peso corporal, com lastro e
 * assistidos têm a carga efetiva calculada a partir do peso NA DATA da série. Sem
 * nenhum registro, a carga desses exercícios fica indefinida e eles ficam fora de
 * recorde e de progressão.
 */
export const useBodyWeight = () => {
    const logsQuery = useQuery<BodyWeightLog[]>({
        queryKey: BODY_WEIGHT_QUERY_KEY,
        queryFn: async () => {
            const response = await api.get("/users/body-weight");
            return response.data;
        }
    });

    const createMutation = useAppMutation<BodyWeightLog, unknown, CreateBodyWeightPayload>({
        mutationFn: async (payload) => {
            const response = await api.post("/users/body-weight", payload);
            return response.data;
        },
        invalidateQueries: [BODY_WEIGHT_QUERY_KEY],
    });

    const deleteMutation = useAppMutation<void, unknown, number>({
        mutationFn: async (id) => {
            await api.delete(`/users/body-weight/${id}`);
        },
        invalidateQueries: [BODY_WEIGHT_QUERY_KEY],
    });

    const logs = logsQuery.data ?? [];

    return {
        logs,
        current: logs[0] ?? null,
        isLoading: logsQuery.isLoading,
        createBodyWeight: createMutation.mutate,
        isCreating: createMutation.isPending,
        deleteBodyWeight: deleteMutation.mutate,
        isDeleting: deleteMutation.isPending,
    };
};
