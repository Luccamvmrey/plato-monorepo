import { useEffect, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { useAuthStore } from "@/features/auth/auth.store.ts";
import { NotificationService } from "../notification.service.ts";
import { getDeviceSubscription } from "../utils/push-support.ts";

/**
 * A cada abertura do app: reenvia a inscrição existente, o que mantém o fuso em dia e cobre
 * o navegador que trocou de endpoint sozinho. Nunca cria inscrição nem pede permissão.
 *
 * Também registra a abertura vinda de uma notificação (`?n=<id>`), para medir se elas servem.
 */
export const useNotificationLifecycle = () => {
    const userId = useAuthStore((state) => state.user?.id);
    const [location, navigate] = useLocation();
    const search = useSearch();
    const syncedFor = useRef<number | null>(null);

    const notificationId = new URLSearchParams(search).get("n");

    useEffect(() => {
        if (userId === undefined || syncedFor.current === userId) return;

        syncedFor.current = userId;

        void getDeviceSubscription()
            .then((subscription) => subscription && NotificationService.saveSubscription(subscription))
            .catch(() => undefined);
    }, [userId]);

    useEffect(() => {
        if (userId === undefined || !notificationId || !/^\d+$/.test(notificationId)) return;

        void NotificationService.markOpened(notificationId).catch(() => undefined);
        navigate(location, { replace: true });
    }, [userId, notificationId, location, navigate]);
};
