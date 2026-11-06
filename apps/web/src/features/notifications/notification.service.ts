import api from "@/core/api";
import { getTimezone } from "./utils/push-support.ts";

export interface NotificationSettings {
    publicKey: string | null;
    remindersEnabled: boolean;
    summariesEnabled: boolean;
    emailSummaryEnabled: boolean;
    reminderHour: number;
    shouldPrompt: boolean;
    /** Só mostra a ferramenta; quem barra de verdade é o `requireAdmin` da rota. */
    canDebug: boolean;
}

export type NotificationSettingsUpdate = Partial<
    Pick<NotificationSettings, "remindersEnabled" | "summariesEnabled" | "emailSummaryEnabled" | "reminderHour">
>;

export const NotificationService = {
    getSettings: async () => {
        const response = await api.get<NotificationSettings>("/notifications/settings", {
            params: { timezone: getTimezone() },
        });

        return response.data;
    },

    updateSettings: async (data: NotificationSettingsUpdate) => {
        const response = await api.put<NotificationSettings>("/notifications/settings", {
            ...data,
            timezone: getTimezone(),
        });

        return response.data;
    },

    saveSubscription: async (subscription: PushSubscription) => {
        const { endpoint, keys } = subscription.toJSON();

        await api.post("/notifications/subscriptions", { endpoint, keys, timezone: getTimezone() });
    },

    removeSubscription: async (endpoint: string) => {
        await api.delete("/notifications/subscriptions", { data: { endpoint } });
    },

    dismissPrompt: async () => {
        await api.post("/notifications/prompt-dismissed");
    },

    markOpened: async (id: string) => {
        await api.post(`/notifications/${id}/opened`);
    },

    sendTest: async () => {
        await api.post("/notifications/test");
    },

    scheduleRestAlert: async (endpoint: string, remainingMs: number, measureFrom: number) => {
        await api.post("/notifications/rest-alert", { endpoint, remainingMs, measureFrom });
    },

    cancelRestAlert: async () => {
        await api.delete("/notifications/rest-alert");
    },

    unsubscribeEmail: async (token: string) => {
        await api.post(`/notifications/unsubscribe/${token}`);
    },
};
