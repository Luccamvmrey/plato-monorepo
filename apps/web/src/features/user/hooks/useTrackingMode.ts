import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/core/api";
import { useAuthStore } from "@/features/auth/auth.store";
import { useActiveSession } from "@/features/workouts/hooks/useActiveSession";
import type { TrackingModeValue } from "../tracking-modes";

interface TrackingPreference {
    trackingMode: TrackingModeValue;
    needsChoice: boolean;
}

const QUERY_KEY = ["tracking-mode"];

/** Modo de treino, preferência pessoal. Vale a partir do próximo treino iniciado. */
export const useTrackingMode = () => {
    const queryClient = useQueryClient();
    const userId = useAuthStore((state) => state.user?.id);
    const { findActiveSessionQuery } = useActiveSession();

    const preferenceQuery = useQuery<TrackingPreference>({
        queryKey: QUERY_KEY,
        queryFn: async () => (await api.get("/users/tracking-mode")).data,
    });

    const mutation = useMutation({
        mutationFn: async (trackingMode: TrackingModeValue) => {
            await api.put(`/users/${userId}`, { trackingMode });
        },
        // Otimista: um seletor que espera a rede parece travado, e na falha volta sozinho.
        onMutate: async (trackingMode) => {
            await queryClient.cancelQueries({ queryKey: QUERY_KEY });
            const previous = queryClient.getQueryData<TrackingPreference>(QUERY_KEY);

            queryClient.setQueryData<TrackingPreference>(QUERY_KEY, { trackingMode, needsChoice: false });

            return { previous };
        },
        onError: (_error, _mode, context) => {
            queryClient.setQueryData(QUERY_KEY, context?.previous);
        },
    });

    return {
        trackingMode: preferenceQuery.data?.trackingMode,
        needsChoice: preferenceQuery.data?.needsChoice ?? false,
        isLoading: preferenceQuery.isLoading,
        setTrackingMode: mutation.mutate,
        saveTrackingMode: mutation.mutateAsync,
        hasActiveSession: !!findActiveSessionQuery.data?.activeSession,
        hasError: mutation.isError,
    };
};
