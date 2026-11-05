import prisma from "@plato/database";
import {
    addDaysToDateStr,
    daysBetweenDateStrs,
    decideNotification,
    isSunday,
    monthlyPeriod,
    reminderMessage,
    summarizePeriod,
    summaryMessage,
    toLocalDateStr,
    toLocalHour,
    weeklyPeriod,
} from "@plato/shared";
import type { NotificationDecision, NotificationMessage, PeriodSummary } from "@plato/shared";
import * as programService from "../modules/program/program.service";
import { sendEmail } from "../shared/email/email";
import { sendPushToUser } from "../shared/push/push";
import { getAppUrl } from "../shared/utils/app-url";

const CYCLE_INTERVAL_MS = 5 * 60_000;
/** Cobre o terceiro lembrete e o limite diário, sem carregar o histórico inteiro. */
const LOG_LOOKBACK_MS = 60 * 86_400_000;
const NOTIFICATION_LANDING = { REMINDER: "/workouts", WEEKLY_SUMMARY: "/history", MONTHLY_SUMMARY: "/history" } as const;

type DueKind = NotificationDecision["kind"];

const isUniqueViolation = (error: unknown) =>
    typeof error === "object" && error !== null && "code" in error && error.code === "P2002";

/**
 * Insere antes de enviar. O índice único transforma o conflito em "outra execução já pegou",
 * o que dispensa trava no banco: o pooler do Supabase em modo transação não a sustentaria.
 * Se o processo cair logo depois, a pessoa perde a notificação, mas nunca recebe duas.
 */
const claim = async (userId: number, kind: DueKind, channel: "PUSH" | "EMAIL", periodKey: string) => {
    try {
        return await prisma.notificationLog.create({ data: { userId, kind, channel, periodKey } });
    } catch (error) {
        if (isUniqueViolation(error)) return null;
        throw error;
    }
};

const finishLog = (id: number, status: "SENT" | "FAILED") =>
    prisma.notificationLog.update({ where: { id }, data: { status } });

/** As datas guardadas são UTC e o período é local: busca com folga e filtra pelo dia do usuário. */
const summaryForPeriod = async (
    userId: number,
    timezone: string,
    { from, to }: { from: string; to: string }
): Promise<PeriodSummary> => {
    const range = {
        gte: new Date(`${addDaysToDateStr(from, -1)}T00:00:00Z`),
        lte: new Date(`${addDaysToDateStr(to, 2)}T00:00:00Z`),
    };
    const isInPeriod = (date: Date) => {
        const local = toLocalDateStr(date, timezone);

        return local >= from && local <= to;
    };

    const [sessions, records] = await Promise.all([
        prisma.workoutSession.findMany({
            where: { userId, completedAt: range },
            select: {
                completedAt: true,
                trackingMode: true,
                sessionSet: {
                    select: { actualWeight: true, actualReps: true, equipmentWeight: true, excludedFromRecords: true },
                },
            },
        }),
        prisma.personalRecord.findMany({
            where: { userId, date: range },
            select: { exerciseId: true, date: true },
        }),
    ]);

    return summarizePeriod(
        sessions.filter((session) => isInPeriod(session.completedAt!)),
        records.filter((record) => isInPeriod(record.date)).map((record) => record.exerciseId)
    );
};

const buildPushMessage = async (
    userId: number,
    timezone: string,
    kind: DueKind,
    today: string,
    lastCompletedAt: Date | null
): Promise<NotificationMessage> => {
    if (kind === "REMINDER") {
        const active = await programService.getActiveWithNext(userId);
        const days = lastCompletedAt
            ? daysBetweenDateStrs(toLocalDateStr(lastCompletedAt, timezone), today)
            : null;

        return reminderMessage(days, active?.next?.workout.name ?? null);
    }

    const period = kind === "WEEKLY_SUMMARY" ? weeklyPeriod(today) : monthlyPeriod(today);

    return summaryMessage(kind, await summaryForPeriod(userId, timezone, period));
};

interface DuePreference {
    userId: number;
    timezone: string;
    reminderHour: number;
    remindersEnabled: boolean;
    summariesEnabled: boolean;
    emailSummaryEnabled: boolean;
    activatedAt: Date | null;
    createdAt: Date;
    unsubscribeToken: string;
    user: { email: string; _count: { pushSubscription: number } };
}

const sendPushIfDue = async (preference: DuePreference, now: Date, completedAt: Date[], today: string) => {
    const { userId, timezone } = preference;

    const [openSession, sentPushes] = await Promise.all([
        prisma.workoutSession.findFirst({
            where: { userId, completedAt: null },
            orderBy: { startedAt: "desc" },
            select: { startedAt: true },
        }),
        prisma.notificationLog.findMany({
            where: {
                userId,
                channel: "PUSH",
                status: { in: ["CLAIMED", "SENT"] },
                createdAt: { gte: new Date(now.getTime() - LOG_LOOKBACK_MS) },
            },
            select: { kind: true, createdAt: true },
        }),
    ]);

    const decision = decideNotification({
        now,
        timezone,
        reminderHour: preference.reminderHour,
        remindersEnabled: preference.remindersEnabled,
        summariesEnabled: preference.summariesEnabled,
        completedAt,
        openSessionStartedAt: openSession?.startedAt ?? null,
        activatedAt: preference.activatedAt ?? preference.createdAt,
        sentPushes,
    });

    if (!decision) return;

    const log = await claim(userId, decision.kind, "PUSH", decision.periodKey);

    if (!log) return;

    try {
        const lastCompletedAt = completedAt.length > 0 ? completedAt[completedAt.length - 1] : null;
        const message = await buildPushMessage(userId, timezone, decision.kind, today, lastCompletedAt);
        const delivered = await sendPushToUser(userId, {
            ...message,
            url: `${NOTIFICATION_LANDING[decision.kind]}?n=${log.id}`,
        });

        await finishLog(log.id, delivered > 0 ? "SENT" : "FAILED");
    } catch (error) {
        await finishLog(log.id, "FAILED");
        throw error;
    }
};

const sendWeeklyEmailIfDue = async (preference: DuePreference, today: string) => {
    if (!preference.emailSummaryEnabled || !isSunday(today)) return;

    const { userId, timezone, unsubscribeToken, user } = preference;
    const period = weeklyPeriod(today);
    const summary = await summaryForPeriod(userId, timezone, period);

    if (summary.sessions === 0) return;

    const log = await claim(userId, "WEEKLY_SUMMARY", "EMAIL", period.periodKey);

    if (!log) return;

    const { body } = summaryMessage("WEEKLY_SUMMARY", summary);
    const appUrl = getAppUrl();
    const pageLink = `${appUrl}/email/unsubscribe/${unsubscribeToken}`;

    try {
        await sendEmail({
            to: user.email,
            subject: `Sua semana no Plato: ${body}`,
            text: `Sua semana: ${body}.\n\nVeja o histórico: ${appUrl}/history\n\nPara parar de receber este resumo: ${pageLink}`,
            html: `<p>Sua semana: <strong>${body}</strong>.</p><p><a href="${appUrl}/history">Ver o histórico</a></p><p style="font-size:12px;color:#666"><a href="${pageLink}">Parar de receber este resumo</a></p>`,
            headers: {
                "List-Unsubscribe": `<${appUrl}/api/notifications/unsubscribe/${unsubscribeToken}>`,
                "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
        });

        await finishLog(log.id, "SENT");
    } catch (error) {
        await finishLog(log.id, "FAILED");
        throw error;
    }
};

const processPreference = async (preference: DuePreference, now: Date) => {
    const { userId, timezone } = preference;
    const today = toLocalDateStr(now, timezone);

    const sessions = await prisma.workoutSession.findMany({
        where: { userId, completedAt: { not: null } },
        orderBy: { completedAt: "asc" },
        select: { completedAt: true },
    });
    const completedAt = sessions.map((session) => session.completedAt!);

    if (preference.user._count.pushSubscription > 0) {
        await sendPushIfDue(preference, now, completedAt, today);
    }

    await sendWeeklyEmailIfDue(preference, today);
};

/** Um ciclo completo. O erro de uma pessoa não interrompe as demais. */
export const runNotificationCycle = async (now = new Date()) => {
    const preferences = await prisma.notificationPreference.findMany({
        where: {
            OR: [
                { emailSummaryEnabled: true },
                { user: { pushSubscription: { some: {} } } },
            ],
        },
        include: {
            user: { select: { email: true, _count: { select: { pushSubscription: true } } } },
        },
    });

    const due = preferences.filter(
        (preference) => toLocalHour(now, preference.timezone) === preference.reminderHour
    );

    for (const preference of due) {
        try {
            await processPreference(preference, now);
        } catch (error) {
            console.error(`Notification cycle failed for user ${preference.userId}`, error);
        }
    }
};

/**
 * Ligado só com `SCHEDULER_ENABLED=true`, definido apenas na VPS. O `DATABASE_URL` local
 * aponta para produção, então `npm run dev` nunca pode notificar usuários reais.
 */
export const startNotificationScheduler = () => {
    if (process.env.SCHEDULER_ENABLED !== "true") return;

    let isRunning = false;

    const tick = async () => {
        if (isRunning) return;

        isRunning = true;

        try {
            await runNotificationCycle();
        } catch (error) {
            console.error("Notification cycle failed", error);
        } finally {
            isRunning = false;
        }
    };

    setInterval(tick, CYCLE_INTERVAL_MS).unref();
    console.log("Notification scheduler started");
};
