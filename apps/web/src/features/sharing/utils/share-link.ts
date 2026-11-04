import { toast } from "sonner";
import { path } from "@/core/constants/path.ts";

const PENDING_ADD_KEY = "plato-pending-shared-plan";

export const buildShareUrl = (token: string) => `${window.location.origin}${path.SHARED}/${token}`;

export const copyShareUrl = async (url: string) => {
    try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copiado.");
    } catch {
        toast.error("Não foi possível copiar o link.");
    }
};

/**
 * Marca que a pessoa tocou em "Adicionar" antes de entrar na conta.
 *
 * `add=1` sozinho não basta para adicionar automaticamente: qualquer um pode montar essa
 * URL e mandar para quem já está logado. A marca vive só nesta aba e é gasta uma vez, então
 * prova que o toque veio daqui. Sem o armazenamento, a pessoa só toca no botão de novo.
 */
export const markPendingAdd = (token: string) => {
    try {
        sessionStorage.setItem(PENDING_ADD_KEY, token);
    } catch {
        // Ver acima: sem a marca, o fluxo segue com um toque a mais.
    }
};

export const consumePendingAdd = (token: string) => {
    try {
        const isPending = sessionStorage.getItem(PENDING_ADD_KEY) === token;

        if (isPending) sessionStorage.removeItem(PENDING_ADD_KEY);

        return isPending;
    } catch {
        return false;
    }
};
