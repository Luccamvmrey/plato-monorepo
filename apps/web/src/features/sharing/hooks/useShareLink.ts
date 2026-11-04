import { useState } from "react";
import { useAppMutation } from "@/core/hooks/useAppMutation";
import { SharingService } from "@/features/sharing/sharing.service.ts";
import type { CreateShareLinkPayload, OwnSharedLink } from "@/features/sharing/sharing.types.ts";
import { buildShareUrl, copyShareUrl } from "@/features/sharing/utils/share-link.ts";

export const useShareLink = (source: CreateShareLinkPayload, name: string) => {
    const [link, setLink] = useState<OwnSharedLink | null>(null);

    const createMutation = useAppMutation({
        mutationFn: () => SharingService.create(source),
        invalidateQueries: [["shared-links"]],
        onSuccess: (created: OwnSharedLink) => setLink(created),
    });

    const url = link ? buildShareUrl(link.token) : null;
    const canUseNativeShare = typeof navigator.share === "function";

    const handleCopy = () => {
        if (url) void copyShareUrl(url);
    };

    // O envio é um segundo toque de propósito: o iOS só abre a folha nativa a partir de um
    // gesto, e esse gesto já teria expirado ao fim da chamada que cria o link.
    const handleSend = async () => {
        if (!url) return;

        try {
            await navigator.share({ title: name, text: `${name} no Plato`, url });
        } catch (error) {
            // Fechar a folha nativa também rejeita, e não é erro de ninguém.
            if (error instanceof DOMException && error.name === "AbortError") return;

            await copyShareUrl(url);
        }
    };

    const reset = () => {
        setLink(null);
        createMutation.reset();
    };

    return {
        url,
        canUseNativeShare,
        isCreating: createMutation.isPending,
        handleCreate: () => createMutation.mutate(),
        handleCopy,
        handleSend,
        reset,
    };
};
