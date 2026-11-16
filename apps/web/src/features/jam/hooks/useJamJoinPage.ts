import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useLocation } from "wouter";
import { path } from "@/core/constants/path.ts";
import { useAuthStore } from "@/features/auth/auth.store.ts";
import { JamService } from "@/features/jam/jam.service.ts";

export const statusOf = (error: unknown) => (isAxiosError(error) ? error.response?.status : undefined);

/** A parte da tela de entrada que não depende de login: a prévia e o caminho até a conta. */
export const useJamJoinPage = (token: string) => {
    const [, navigate] = useLocation();
    const isAuthenticated = useAuthStore((state) => !!state.token);

    const previewQuery = useQuery({
        queryKey: ["jam-preview", token],
        queryFn: () => JamService.getPreview(token),
        // Jam inexistente é resposta definitiva: tentar de novo só atrasaria a tela.
        retry: (failureCount, error) => statusOf(error) !== 404 && failureCount < 2,
    });

    // Volta para esta tela depois do login. Entrar continua sendo um toque da pessoa: o QR
    // pode ter sido lido sem intenção de começar a treinar agora.
    const sendToAuth = (target: string) => navigate(`${target}?next=${encodeURIComponent(`${path.JAM}/${token}`)}`);

    return {
        preview: previewQuery.data,
        isLoading: previewQuery.isLoading,
        isUnavailable: previewQuery.isError && statusOf(previewQuery.error) === 404,
        hasLoadError: previewQuery.isError && statusOf(previewQuery.error) !== 404,
        retry: () => void previewQuery.refetch(),
        isAuthenticated,
        handleSignup: () => sendToAuth(path.SIGNUP),
        handleLogin: () => sendToAuth(path.LOGIN),
        goHome: () => navigate(isAuthenticated ? path.WORKOUTS : path.LOGIN),
    };
};
