import type { JamState } from "@plato/shared";
import { path } from "@/core/constants/path.ts";
import { copyShareUrl } from "@/features/sharing/utils/share-link.ts";

export const buildJamUrl = (token: string) => `${window.location.origin}${path.JAM}/${token}`;

/** Link, QR e envio do convite: a tela do QR e a sheet da jam mostram o mesmo. */
export const useJamInvite = (jam: JamState | undefined) => {
    const url = jam ? buildJamUrl(jam.token) : null;

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
        url,
        canUseNativeShare: typeof navigator.share === "function",
        handleCopy: () => url && void copyShareUrl(url),
        handleSend: () => void handleSend(),
    };
};
