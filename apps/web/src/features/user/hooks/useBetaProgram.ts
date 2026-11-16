import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/core/api";

interface BetaStatus {
    enabled: boolean;
    optedInAt: string | null;
}

export const BETA_QUERY_KEY = ["beta"];

/**
 * Programa beta: um toggle só, que libera todas as features em teste. Também é o que as
 * features consultam para decidir se aparecem (`isEnabled`); o servidor confere de novo.
 */
export const useBetaProgram = () => {
    const queryClient = useQueryClient();

    const statusQuery = useQuery<BetaStatus>({
        queryKey: BETA_QUERY_KEY,
        queryFn: async () => (await api.get("/users/beta")).data,
    });

    const mutation = useMutation({
        mutationFn: async (enabled: boolean): Promise<BetaStatus> => (await api.put("/users/beta", { enabled })).data,
        // Otimista, como o modo de treino: um switch que espera a rede parece travado.
        onMutate: async (enabled) => {
            await queryClient.cancelQueries({ queryKey: BETA_QUERY_KEY });
            const previous = queryClient.getQueryData<BetaStatus>(BETA_QUERY_KEY);

            queryClient.setQueryData<BetaStatus>(BETA_QUERY_KEY, {
                enabled,
                optedInAt: enabled ? (previous?.optedInAt ?? new Date().toISOString()) : null,
            });

            return { previous };
        },
        onError: (_error, _enabled, context) => {
            queryClient.setQueryData(BETA_QUERY_KEY, context?.previous);
        },
        onSuccess: (status) => {
            queryClient.setQueryData(BETA_QUERY_KEY, status);
        },
    });

    return {
        isLoaded: statusQuery.data !== undefined,
        isEnabled: statusQuery.data?.enabled ?? false,
        setEnabled: mutation.mutate,
        /** Para quem precisa esperar o servidor confirmar antes de seguir (entrar numa jam). */
        enable: () => mutation.mutateAsync(true),
        hasError: mutation.isError,
    };
};
