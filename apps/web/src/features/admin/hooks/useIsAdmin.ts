import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/auth.store.ts";
import { NotificationService } from "@/features/notifications/notification.service.ts";

const SETTINGS_STALE_MS = 5 * 60_000;

/**
 * Para liberar recurso novo primeiro às contas admin. Quem barra de verdade é a rota.
 *
 * Usa a chave da tela de notificações, mas só busca quando `enabled`, para não custar um
 * pedido a cada abertura do app.
 */
export const useIsAdmin = (enabled: boolean): boolean => {
    const userId = useAuthStore((state) => state.user?.id);

    const { data = false } = useQuery({
        queryKey: ["notification-settings", userId],
        queryFn: NotificationService.getSettings,
        enabled: userId !== undefined && enabled,
        staleTime: SETTINGS_STALE_MS,
        select: (settings) => settings.canDebug,
    });

    return data;
};
