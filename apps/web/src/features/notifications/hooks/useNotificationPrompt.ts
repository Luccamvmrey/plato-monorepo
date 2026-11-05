import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { NotificationService } from "../notification.service.ts";
import { useNotificationSettings } from "./useNotificationSettings.ts";
import { usePushDevice } from "./usePushDevice.ts";

const RECENT_WORKOUT_MS = 30 * 60_000;

/**
 * Convite depois de concluir um treino: é quando a pessoa já viu valor no app e, no iPhone,
 * quando instalar não custa nada, porque não há treino em andamento no armazenamento local.
 */
export const useNotificationPrompt = (completedAt: string | Date | null | undefined) => {
    const queryClient = useQueryClient();
    const { settings, refresh } = useNotificationSettings();
    const device = usePushDevice(settings?.publicKey, refresh);
    const [isHidden, setIsHidden] = useState(false);
    // Congelado ao abrir: o card não pode sumir sozinho enquanto a pessoa lê.
    const [openedAt] = useState(() => Date.now());
    const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);

    const dismissMutation = useMutation({
        mutationFn: NotificationService.dismissPrompt,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notification-settings"] }),
    });

    // A página também abre a partir do histórico, e ali o convite ficaria fora de contexto.
    const finishedRecently =
        !!completedAt && openedAt - new Date(completedAt).getTime() < RECENT_WORKOUT_MS;

    const isEligible =
        finishedRecently &&
        !isHidden &&
        !device.isLoading &&
        !device.isSubscribed &&
        !!settings?.publicKey &&
        settings.shouldPrompt &&
        (device.support === "prompt" || device.support === "granted" || device.support === "needs-install");

    const handleAccept = () => {
        if (device.support === "needs-install") {
            setIsInstructionsOpen(true);
            return;
        }

        void device.enable().then(() => setIsHidden(true)).catch(() => undefined);
    };

    const handleDismiss = () => {
        setIsHidden(true);
        dismissMutation.mutate();
    };

    return {
        isVisible: isEligible,
        needsInstall: device.support === "needs-install",
        isEnabling: device.isEnabling,
        hasError: device.hasError,
        isInstructionsOpen,
        setIsInstructionsOpen,
        handleAccept,
        handleDismiss,
    };
};
