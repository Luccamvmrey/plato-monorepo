import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { NotificationService } from "../notification.service.ts";
import { getDeviceSubscription, getPushSupport, subscribeDevice } from "../utils/push-support.ts";

const DEVICE_QUERY_KEY = ["push-device"];

const isDeviceLost = (error: unknown) => isAxiosError(error) && error.response?.status === 409;

/** A inscrição deste aparelho. Mora no navegador, então cada aparelho responde por si. */
export const usePushDevice = (publicKey: string | null | undefined, onChanged: () => void) => {
    const queryClient = useQueryClient();
    const [support, setSupport] = useState(getPushSupport);

    const deviceQuery = useQuery({
        queryKey: DEVICE_QUERY_KEY,
        queryFn: async () => (await getDeviceSubscription())?.endpoint ?? null,
    });

    const refreshDevice = () => {
        void queryClient.invalidateQueries({ queryKey: DEVICE_QUERY_KEY });
        onChanged();
    };

    const enableMutation = useMutation({
        mutationFn: async () => {
            if (!publicKey) throw new Error("Push is not configured");

            // Primeira coisa do toque, sem `await` antes: o iOS só mostra o pedido de permissão
            // dentro de uma interação direta da pessoa.
            const permission = await Notification.requestPermission();

            setSupport(getPushSupport());

            if (permission !== "granted") return;

            await NotificationService.saveSubscription(await subscribeDevice(publicKey));
        },
        onSuccess: refreshDevice,
    });

    const disableMutation = useMutation({
        mutationFn: async () => {
            const subscription = await getDeviceSubscription();

            if (!subscription) return;

            const { endpoint } = subscription;

            await subscription.unsubscribe();
            await NotificationService.removeSubscription(endpoint);
        },
        onSuccess: refreshDevice,
    });

    const testMutation = useMutation({ mutationFn: NotificationService.sendTest });

    const errorMessage = enableMutation.isError
        ? "Não foi possível ativar. Tente novamente."
        : disableMutation.isError
            ? "Não foi possível desativar. Tente novamente."
            : testMutation.isError
                ? isDeviceLost(testMutation.error)
                    ? "O serviço de push recusou o envio. Logo depois de ativar isso é normal: tente de novo em instantes."
                    : "Não foi possível enviar o teste. Tente novamente."
                : null;

    return {
        support,
        isSubscribed: !!deviceQuery.data,
        isLoading: deviceQuery.isLoading,
        enable: enableMutation.mutateAsync,
        disable: disableMutation.mutate,
        sendTest: testMutation.mutate,
        isEnabling: enableMutation.isPending,
        isDisabling: disableMutation.isPending,
        isTesting: testMutation.isPending,
        testSent: testMutation.isSuccess,
        hasError: errorMessage !== null,
        errorMessage,
    };
};
