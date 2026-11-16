import { useLocation } from "wouter";
import { JAM_MAX_MEMBERS } from "@plato/shared";
import { path } from "@/core/constants/path.ts";
import { useAuthStore } from "@/features/auth/auth.store.ts";
import { copyShareUrl } from "@/features/sharing/utils/share-link.ts";
import { useActiveSession } from "@/features/workouts/hooks/useActiveSession.ts";
import { useJam } from "./useJam.ts";

export const buildJamUrl = (token: string) => `${window.location.origin}${path.JAM}/${token}`;

/** Tela do QR: quem criou mostra, quem já está pode mostrar para chamar mais alguém. */
export const useJamQrPage = (jamId: number) => {
    const [, navigate] = useLocation();
    const currentUserId = useAuthStore((state) => state.user?.id);
    const jamQuery = useJam(jamId);
    const { findActiveSessionQuery } = useActiveSession();

    const jam = jamQuery.data;
    const url = jam ? buildJamUrl(jam.token) : null;
    const activeMembers = jam?.members.filter((member) => member.leftAt === null).length ?? 0;
    const workoutId = findActiveSessionQuery.data?.activeSession?.workoutId;

    const handleSend = async () => {
        if (!url || !jam) return;

        try {
            await navigator.share({ title: "Jam no Plato", text: `Treina comigo: ${jam.workout.name}`, url });
        } catch (error) {
            // Fechar a folha nativa também rejeita, e não é erro de ninguém.
            if (error instanceof DOMException && error.name === "AbortError") return;

            await copyShareUrl(url);
        }
    };

    return {
        jam,
        url,
        isLoading: jamQuery.isLoading,
        isUnavailable: jamQuery.isError,
        currentUserId,
        memberLabel: `${activeMembers} de ${JAM_MAX_MEMBERS} pessoas`,
        canUseNativeShare: typeof navigator.share === "function",
        handleCopy: () => url && void copyShareUrl(url),
        handleSend,
        handleStart: () => navigate(workoutId ? `${path.ACTIVE_WORKOUT}/${workoutId}` : path.WORKOUTS),
    };
};
