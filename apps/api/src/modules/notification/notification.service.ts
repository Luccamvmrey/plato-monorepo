import { randomBytes } from "crypto";
import prisma from "@plato/database";
import { habitualHour, isValidTimezone } from "@plato/shared";
import { AppError } from "../../shared/error/AppError";
import { isAdminUser } from "../../shared/middleware/authMiddleware";
import { getVapidPublicKey, isAllowedPushEndpoint, sendPushToUser } from "../../shared/push/push";
import { ensureOwnership } from "../../shared/utils/auth";
import { SubscribeInput, UpdateSettingsInput } from "./notification.schema";

const DEFAULT_TIMEZONE = "America/Sao_Paulo";
const PROMPT_COOLDOWN_MS = 30 * 86_400_000;
/** Olha só o passado recente: o horário de treino de um ano atrás não diz nada. */
const HABIT_SAMPLE_SIZE = 20;

const suggestedHour = async (userId: number, timezone: string) => {
    const sessions = await prisma.workoutSession.findMany({
        where: { userId, completedAt: { not: null } },
        orderBy: { startedAt: "desc" },
        take: HABIT_SAMPLE_SIZE,
        select: { startedAt: true },
    });

    return habitualHour(sessions.map((session) => session.startedAt), timezone);
};

const ensurePreference = async (userId: number, timezone: string) => {
    const existing = await prisma.notificationPreference.findUnique({ where: { userId } });

    if (existing) return existing;

    return prisma.notificationPreference.upsert({
        where: { userId },
        update: {},
        create: {
            userId,
            timezone,
            reminderHour: await suggestedHour(userId, timezone),
            unsubscribeToken: randomBytes(32).toString("base64url"),
        },
    });
};

const getSettings = async (userId: number, requestedTimezone?: string) => {
    const timezone = requestedTimezone && isValidTimezone(requestedTimezone) ? requestedTimezone : DEFAULT_TIMEZONE;

    const [preference, subscriptionCount] = await Promise.all([
        prisma.notificationPreference.findUnique({ where: { userId } }),
        prisma.pushSubscription.count({ where: { userId } }),
    ]);

    const dismissedAt = preference?.promptDismissedAt?.getTime();

    return {
        publicKey: getVapidPublicKey(),
        canDebug: isAdminUser(userId),
        remindersEnabled: preference?.remindersEnabled ?? true,
        summariesEnabled: preference?.summariesEnabled ?? true,
        emailSummaryEnabled: preference?.emailSummaryEnabled ?? false,
        // Sem preferência salva, a tela já abre com o horário em que a pessoa costuma treinar.
        reminderHour: preference?.reminderHour ?? await suggestedHour(userId, timezone),
        shouldPrompt:
            subscriptionCount === 0 &&
            (dismissedAt === undefined || Date.now() - dismissedAt >= PROMPT_COOLDOWN_MS),
    };
};

const updateSettings = async (userId: number, data: UpdateSettingsInput) => {
    await ensurePreference(userId, data.timezone ?? DEFAULT_TIMEZONE);

    await prisma.notificationPreference.update({ where: { userId }, data });

    return getSettings(userId, data.timezone);
};

/**
 * Idempotente: roda a cada abertura do app para manter o fuso e a inscrição em dia.
 * Inscrever o mesmo aparelho em outra conta transfere a linha.
 */
const subscribe = async (userId: number, { endpoint, keys, timezone }: SubscribeInput) => {
    if (!isAllowedPushEndpoint(endpoint)) {
        throw new AppError("Unsupported push endpoint", 400);
    }

    await ensurePreference(userId, timezone);

    const existingCount = await prisma.pushSubscription.count({ where: { userId } });

    await prisma.$transaction([
        prisma.pushSubscription.upsert({
            where: { endpoint },
            update: { userId, p256dh: keys.p256dh, auth: keys.auth },
            create: { userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
        }),
        prisma.notificationPreference.update({
            where: { userId },
            data: {
                timezone,
                // Só ao ativar de verdade: a sincronização diária não pode adiar os lembretes.
                ...(existingCount === 0 ? { activatedAt: new Date() } : {}),
            },
        }),
    ]);
};

const removeDevice = async (userId: number, endpoint: string) => {
    await prisma.pushSubscription.deleteMany({ where: { userId, endpoint } });
};

const dismissPrompt = async (userId: number) => {
    await ensurePreference(userId, DEFAULT_TIMEZONE);

    await prisma.notificationPreference.update({
        where: { userId },
        data: { promptDismissedAt: new Date() },
    });
};

const markOpened = async (userId: number, id: number) => {
    const log = await prisma.notificationLog.findUnique({ where: { id } });

    ensureOwnership(log, userId, "This notification does not belong to the user");

    await prisma.notificationLog.updateMany({
        where: { id, openedAt: null },
        data: { openedAt: new Date() },
    });
};

const sendTest = async (userId: number) => {
    const delivered = await sendPushToUser(userId, {
        title: "Notificações ativadas",
        body: "É assim que os lembretes do Plato vão aparecer",
        url: "/profile",
    });

    if (delivered === 0) {
        throw new AppError("No device could receive the notification", 409);
    }
};

const unsubscribeEmail = async (token: string) => {
    const { count } = await prisma.notificationPreference.updateMany({
        where: { unsubscribeToken: token },
        data: { emailSummaryEnabled: false },
    });

    if (count === 0) throw new AppError("This link is not available", 404);
};

export {
    getSettings,
    updateSettings,
    subscribe,
    removeDevice,
    dismissPrompt,
    markOpened,
    sendTest,
    unsubscribeEmail,
};
