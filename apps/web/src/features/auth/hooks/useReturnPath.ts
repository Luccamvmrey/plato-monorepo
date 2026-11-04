import { useSearch } from "wouter";
import { isSafeReturnPath } from "@plato/shared";

/**
 * Para onde voltar depois de entrar na conta. O `next` vem da URL e pode ter sido montado
 * por qualquer pessoa, então só vale o que passar pela lista fechada de `isSafeReturnPath`.
 */
export const useReturnPath = () => {
    const search = useSearch();
    const next = new URLSearchParams(search).get("next");
    const returnPath = isSafeReturnPath(next) ? next : null;

    const withReturn = (target: string) =>
        returnPath ? `${target}?next=${encodeURIComponent(returnPath)}` : target;

    return { returnPath, withReturn };
};
