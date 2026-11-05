import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/auth.store.ts";
import {
    NotificationService,
    type NotificationSettings,
    type NotificationSettingsUpdate,
} from "../notification.service.ts";

export const useNotificationSettings = () => {
    const queryClient = useQueryClient();
    const userId = useAuthStore((state) => state.user?.id);
    // Por usuário: o cache sobrevive ao logout, e outra conta no aparelho não pode ver estas opções.
    const queryKey = ["notification-settings", userId];

    const settingsQuery = useQuery<NotificationSettings>({
        queryKey,
        queryFn: NotificationService.getSettings,
        enabled: userId !== undefined,
    });

    const mutation = useMutation({
        mutationFn: NotificationService.updateSettings,
        // Otimista: um interruptor que espera a rede parece travado, e na falha volta sozinho.
        onMutate: async (update: NotificationSettingsUpdate) => {
            await queryClient.cancelQueries({ queryKey });
            const previous = queryClient.getQueryData<NotificationSettings>(queryKey);

            if (previous) queryClient.setQueryData<NotificationSettings>(queryKey, { ...previous, ...update });

            return { previous };
        },
        onError: (_error, _update, context) => {
            queryClient.setQueryData(queryKey, context?.previous);
        },
    });

    return {
        settings: settingsQuery.data,
        updateSettings: mutation.mutate,
        hasError: mutation.isError,
        refresh: () => queryClient.invalidateQueries({ queryKey }),
    };
};
