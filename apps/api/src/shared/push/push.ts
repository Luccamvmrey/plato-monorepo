import prisma from "@plato/database";
import webpush from "web-push";

export interface PushMessage {
    title: string;
    body: string;
    url: string;
}

/**
 * O servidor faz POST na URL que o cliente informa. Sem esta lista, a inscrição viraria
 * uma forma de fazer a VPS chamar qualquer endereço, inclusive interno.
 */
const ALLOWED_PUSH_HOSTS = [
    /^fcm\.googleapis\.com$/,
    /^(?:[a-z0-9-]+\.)*push\.apple\.com$/,
    /^(?:[a-z0-9-]+\.)*push\.services\.mozilla\.com$/,
    /^(?:[a-z0-9-]+\.)*notify\.windows\.com$/,
];

export const isAllowedPushEndpoint = (endpoint: string): boolean => {
    let url: URL;

    try {
        url = new URL(endpoint);
    } catch {
        return false;
    }

    return (
        url.protocol === "https:" &&
        url.port === "" &&
        url.username === "" &&
        ALLOWED_PUSH_HOSTS.some((host) => host.test(url.hostname))
    );
};

export const getVapidPublicKey = (): string | null => process.env.VAPID_PUBLIC_KEY ?? null;

const getVapidDetails = () => {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;

    if (!publicKey || !privateKey) throw new Error("VAPID keys are not configured");

    return {
        subject: process.env.VAPID_SUBJECT ?? "https://plato-work-out.com",
        publicKey,
        privateKey,
    };
};

const SEND_TIMEOUT_MS = 10_000;
/** Lembrete de ontem não vale nada: o serviço de push descarta depois de 12h. */
const MESSAGE_TTL_SECONDS = 12 * 3600;
const GONE_STATUS_CODES = [404, 410];

const statusCodeOf = (error: unknown): number | undefined =>
    error instanceof webpush.WebPushError ? error.statusCode : undefined;

/**
 * Envia para todos os aparelhos da pessoa e devolve em quantos foi aceito. Inscrição que o
 * serviço diz não existir mais é apagada: é assim que aparelhos abandonados saem do ciclo.
 */
export const sendPushToUser = async (userId: number, message: PushMessage): Promise<number> => {
    const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
    const vapidDetails = getVapidDetails();

    const results = await Promise.allSettled(
        subscriptions.map(async (subscription) => {
            try {
                await webpush.sendNotification(
                    {
                        endpoint: subscription.endpoint,
                        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
                    },
                    JSON.stringify(message),
                    { vapidDetails, TTL: MESSAGE_TTL_SECONDS, timeout: SEND_TIMEOUT_MS }
                );
            } catch (error) {
                const statusCode = statusCodeOf(error);

                if (statusCode !== undefined && GONE_STATUS_CODES.includes(statusCode)) {
                    await prisma.pushSubscription.deleteMany({ where: { id: subscription.id } });
                } else {
                    console.error(`Push failed for subscription ${subscription.id}: ${statusCode ?? "network error"}`);
                }

                throw error;
            }
        })
    );

    return results.filter((result) => result.status === "fulfilled").length;
};
