import { addDaysToDateStr, mondayOfDateStr, toLocalDateStr } from "./dates";
import type { NotificationKindValue } from "./notifications";

/** Fuso único para as semanas do painel: os usuários estão no Brasil. */
const METRICS_TIMEZONE = "America/Sao_Paulo";
const WEEKS_SHOWN = 12;
const DAY_MS = 86_400_000;

export type AdminFeature =
    | "PROGRAM"
    | "SIMPLE_MODE"
    | "PUSH"
    | "SHARED_LINK"
    | "COPIED_PLAN"
    | "BODY_WEIGHT"
    | "MCP";

export interface AdminMetricsInput {
    users: readonly {
        id: number;
        name: string | null;
        createdAt: Date;
        trackingMode: "FULL" | "SIMPLE";
        activePrograms: number;
        pushDevices: number;
        sharedLinks: number;
        bodyWeightLogs: number;
        mcpSessions: number;
    }[];
    completedSessions: readonly { userId: number; completedAt: Date }[];
    /** Quem tem ao menos um treino copiado de um link. */
    copiedPlanUserIds: readonly number[];
    pushLogs: readonly {
        kind: NotificationKindValue;
        status: "CLAIMED" | "SENT" | "FAILED";
        openedAt: Date | null;
    }[];
}

export interface AdminMetrics {
    summary: {
        users: number;
        active7d: number;
        active28d: number;
        sessionsThisWeek: number;
    };
    /** Da semana mais antiga para a atual. `weekStart` é a segunda-feira, em `YYYY-MM-DD`. */
    weekly: { weekStart: string; activeUsers: number; sessions: number; signups: number }[];
    /** Da mais usada para a menos usada. */
    features: { feature: AdminFeature; users: number }[];
    /** Quem treinou por último vem primeiro; quem nunca treinou, no fim, do cadastro mais novo. */
    users: {
        id: number;
        name: string | null;
        createdAt: string;
        lastWorkoutAt: string | null;
        totalSessions: number;
        sessions28d: number;
        features: AdminFeature[];
    }[];
    notifications: { kind: NotificationKindValue; sent: number; failed: number; opened: number }[];
}

const FEATURE_ORDER: readonly AdminFeature[] = [
    "PROGRAM",
    "SIMPLE_MODE",
    "PUSH",
    "SHARED_LINK",
    "COPIED_PLAN",
    "BODY_WEIGHT",
    "MCP",
];

const NOTIFICATION_KINDS: readonly NotificationKindValue[] = ["REMINDER", "WEEKLY_SUMMARY", "MONTHLY_SUMMARY"];

const weekOf = (date: Date) => mondayOfDateStr(toLocalDateStr(date, METRICS_TIMEZONE));

export const buildAdminMetrics = (
    { users, completedSessions, copiedPlanUserIds, pushLogs }: AdminMetricsInput,
    now: Date
): AdminMetrics => {
    const copiedPlan = new Set(copiedPlanUserIds);
    const since = (days: number) => now.getTime() - days * DAY_MS;
    const isWithin = (date: Date, days: number) => date.getTime() >= since(days);

    const usersWithin = (days: number) =>
        new Set(completedSessions.filter((s) => isWithin(s.completedAt, days)).map((s) => s.userId)).size;

    const currentWeek = weekOf(now);
    const weekly = Array.from({ length: WEEKS_SHOWN }, (_, index) => {
        const weekStart = addDaysToDateStr(currentWeek, (index - WEEKS_SHOWN + 1) * 7);
        const sessions = completedSessions.filter((s) => weekOf(s.completedAt) === weekStart);

        return {
            weekStart,
            activeUsers: new Set(sessions.map((s) => s.userId)).size,
            sessions: sessions.length,
            signups: users.filter((user) => weekOf(user.createdAt) === weekStart).length,
        };
    });

    const userRows = users.map((user) => {
        const sessions = completedSessions.filter((s) => s.userId === user.id);
        const lastWorkout = sessions.reduce<Date | null>(
            (latest, s) => (latest === null || s.completedAt > latest ? s.completedAt : latest),
            null
        );
        const enabled: Record<AdminFeature, boolean> = {
            PROGRAM: user.activePrograms > 0,
            SIMPLE_MODE: user.trackingMode === "SIMPLE",
            PUSH: user.pushDevices > 0,
            SHARED_LINK: user.sharedLinks > 0,
            COPIED_PLAN: copiedPlan.has(user.id),
            BODY_WEIGHT: user.bodyWeightLogs > 0,
            MCP: user.mcpSessions > 0,
        };

        return {
            id: user.id,
            name: user.name,
            createdAt: user.createdAt.toISOString(),
            lastWorkoutAt: lastWorkout?.toISOString() ?? null,
            totalSessions: sessions.length,
            sessions28d: sessions.filter((s) => isWithin(s.completedAt, 28)).length,
            features: FEATURE_ORDER.filter((feature) => enabled[feature]),
        };
    });

    userRows.sort((a, b) =>
        // As datas estão em ISO, então a ordem do texto é a ordem do tempo.
        (b.lastWorkoutAt ?? "").localeCompare(a.lastWorkoutAt ?? "") || b.createdAt.localeCompare(a.createdAt)
    );

    return {
        summary: {
            users: users.length,
            active7d: usersWithin(7),
            active28d: usersWithin(28),
            sessionsThisWeek: weekly[weekly.length - 1].sessions,
        },
        weekly,
        features: FEATURE_ORDER
            .map((feature) => ({
                feature,
                users: userRows.filter((user) => user.features.includes(feature)).length,
            }))
            .sort((a, b) => b.users - a.users),
        users: userRows,
        notifications: NOTIFICATION_KINDS.map((kind) => {
            const logs = pushLogs.filter((log) => log.kind === kind);

            return {
                kind,
                sent: logs.filter((log) => log.status === "SENT").length,
                failed: logs.filter((log) => log.status === "FAILED").length,
                opened: logs.filter((log) => log.openedAt !== null).length,
            };
        }),
    };
};
