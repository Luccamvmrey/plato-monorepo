const RENEW_WHEN_LESS_THAN_MS = 15 * 24 * 60 * 60 * 1000;

/** Só lê a validade para decidir quando renovar. Quem valida o token é a API. */
export const shouldRenewToken = (token: string): boolean => {
    try {
        const encoded = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        const { exp } = JSON.parse(atob(encoded)) as { exp?: number };

        return typeof exp === "number" && exp * 1000 - Date.now() < RENEW_WHEN_LESS_THAN_MS;
    } catch {
        return false;
    }
};
