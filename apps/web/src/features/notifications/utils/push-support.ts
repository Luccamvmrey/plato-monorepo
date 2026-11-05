import { API_BASE_URL } from "@/core/api/base-url.ts";

export type PushSupport = "unsupported" | "needs-install" | "prompt" | "granted" | "denied";

declare global {
    interface Navigator {
        /** Só existe no Safari do iOS. */
        standalone?: boolean;
    }
}

const isIOS = () =>
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // O iPad se identifica como Mac desde o iPadOS 13. Mac de verdade não tem toque.
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const isInstalled = () =>
    window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

export const getPushSupport = (): PushSupport => {
    // Vem antes da checagem de API: no Safari em aba comum o PushManager nem existe, e isso
    // não quer dizer "sem suporte", e sim "falta instalar".
    if (isIOS() && !isInstalled()) return "needs-install";

    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        return "unsupported";
    }

    if (Notification.permission === "granted") return "granted";

    return Notification.permission === "denied" ? "denied" : "prompt";
};

export const getTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

const base64UrlToBytes = (value: string) => {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");

    return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
};

export const getDeviceSubscription = async (): Promise<PushSubscription | null> => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;

    const registration = await navigator.serviceWorker.getRegistration();

    return registration ? registration.pushManager.getSubscription() : null;
};

export const subscribeDevice = async (publicKey: string): Promise<PushSubscription> => {
    const registration = await navigator.serviceWorker.getRegistration();

    if (!registration) throw new Error("Service worker is not registered");

    return registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlToBytes(publicKey),
    });
};

/**
 * Ao sair da conta, o aparelho para de receber na hora. Usa `fetch` porque o cliente axios
 * depende do store de autenticação, que é quem chama esta função.
 *
 * O cancelamento no navegador é o que vale: se o pedido ao servidor falhar (token vencido,
 * sem rede), o próximo envio recebe 410 e a linha é apagada.
 */
export const releaseDeviceOnLogout = async (token: string) => {
    const subscription = await getDeviceSubscription();

    if (!subscription) return;

    const { endpoint } = subscription;

    await subscription.unsubscribe();
    await fetch(`${API_BASE_URL}/notifications/subscriptions`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ endpoint }),
    });
};
