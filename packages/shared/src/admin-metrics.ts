import { addDaysToDateStr, mondayOfDateStr, toLocalDateStr } from "./dates";
import type { NotificationKindValue } from "./notifications";

/** Fuso único para as semanas do painel: os usuários estão no Brasil. */
const METRICS_TIMEZONE = "America/Sao_Paulo";
/** O maior período do gráfico. A tela escolhe quantas semanas mostrar a partir desta lista. */
const WEEKS_SHOWN = 26;
const DAY_MS = 86_400_000;
const NEW_ACCOUNT_DAYS = 7;
/** Sessão aberta há menos que isso pode estar em andamento: ainda não conta como não concluída. */
const IN_PROGRESS_MS = 6 * 3_600_000;

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
    completedSessions: readonly { userId: number; startedAt: Date; completedAt: Date }[];
    /** Sessões sem `completedAt`. As séries delas só chegam ao banco quando a pessoa conclui. */
    openSessions: readonly { userId: number; startedAt: Date }[];
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
        /** Treinos iniciados nos últimos 28 dias que foram concluídos, de 0 a 100. Null sem treinos. */
        completionRate28d: number | null;
        usersWithOpenSession: number;
    };
    /** Da semana mais antiga para a atual. `weekStart` é a segunda-feira, em `YYYY-MM-DD`. */
    weekly: {
        weekStart: string;
        activeUsers: number;
        /** Concluídos na semana, seja qual for o dia em que começaram. */
        sessions: number;
        signups: number;
        /** Iniciados na semana, sem contar os que ainda podem estar em andamento. */
        started: number;
        /** Quantos dos `started` foram concluídos, mesmo que em outra semana. */
        startedAndCompleted: number;
        /** De 0 a 100. Null em semana sem treino iniciado: 0% diria que todos desistiram. */
        completionRate: number | null;
    }[];
    /** Da mais usada para a menos usada. */
    features: { feature: AdminFeature; users: number }[];
    /** Atividade mais recente primeiro, concluída ou aberta. Sem nenhuma, do cadastro mais novo. */
    users: AdminUserRow[];
    notifications: { kind: NotificationKindValue; sent: number; failed: number; opened: number }[];
}

export interface AdminUserRow {
    id: number;
    name: string | null;
    createdAt: string;
    lastWorkoutAt: string | null;
    /** Início da sessão aberta mais recente, se houver. */
    openSessionStartedAt: string | null;
    totalSessions: number;
    sessions28d: number;
    features: AdminFeature[];
}

export type AdminUserStatus = "ALL" | "ACTIVE" | "INACTIVE" | "OPEN_SESSION" | "NEVER_TRAINED" | "NEW";

export interface AdminUserFilters {
    status: AdminUserStatus;
    feature: AdminFeature | "ALL";
    search: string;
}

const normalizeText = (value: string) =>
    value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();

const matchesStatus = (user: AdminUserRow, status: AdminUserStatus, now: Date): boolean => {
    switch (status) {
        case "ALL":
            return true;
        case "ACTIVE":
            return user.sessions28d > 0;
        case "INACTIVE":
            return user.lastWorkoutAt !== null && user.sessions28d === 0;
        case "OPEN_SESSION":
            return user.openSessionStartedAt !== null;
        case "NEVER_TRAINED":
            // Com sessão aberta a pessoa começou a treinar, então "nunca" seria falso.
            return user.lastWorkoutAt === null && user.openSessionStartedAt === null;
        case "NEW":
            return now.getTime() - new Date(user.createdAt).getTime() <= NEW_ACCOUNT_DAYS * DAY_MS;
    }
};

/** A busca ignora maiúsculas e acentos, e também acha pelo número da conta sem nome. */
export const filterAdminUsers = (
    users: readonly AdminUserRow[],
    { status, feature, search }: AdminUserFilters,
    now: Date
): AdminUserRow[] => {
    const term = normalizeText(search).replace(/^#/, "");

    return users.filter((user) =>
        matchesStatus(user, status, now) &&
        (feature === "ALL" || user.features.includes(feature)) &&
        (term === "" || normalizeText(user.name ?? "").includes(term) || String(user.id) === term)
    );
};

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

const completionRate = (completed: number, abandoned: number): number | null =>
    completed + abandoned === 0 ? null : Math.round((completed / (completed + abandoned)) * 100);

export const buildAdminMetrics = (
    { users, completedSessions, openSessions, copiedPlanUserIds, pushLogs }: AdminMetricsInput,
    now: Date
): AdminMetrics => {
    const copiedPlan = new Set(copiedPlanUserIds);
    const since = (days: number) => now.getTime() - days * DAY_MS;
    const isWithin = (date: Date, days: number) => date.getTime() >= since(days);

    const usersWithin = (days: number) =>
        new Set(completedSessions.filter((s) => isWithin(s.completedAt, days)).map((s) => s.userId)).size;

    const abandonedSessions = openSessions.filter((s) => now.getTime() - s.startedAt.getTime() >= IN_PROGRESS_MS);

    const currentWeek = weekOf(now);
    const weekly = Array.from({ length: WEEKS_SHOWN }, (_, index) => {
        const weekStart = addDaysToDateStr(currentWeek, (index - WEEKS_SHOWN + 1) * 7);
        const sessions = completedSessions.filter((s) => weekOf(s.completedAt) === weekStart);
        const startedAndCompleted = completedSessions.filter((s) => weekOf(s.startedAt) === weekStart).length;
        const abandoned = abandonedSessions.filter((s) => weekOf(s.startedAt) === weekStart).length;

        return {
            weekStart,
            activeUsers: new Set(sessions.map((s) => s.userId)).size,
            sessions: sessions.length,
            signups: users.filter((user) => weekOf(user.createdAt) === weekStart).length,
            started: startedAndCompleted + abandoned,
            startedAndCompleted,
            completionRate: completionRate(startedAndCompleted, abandoned),
        };
    });

    const userRows = users.map((user) => {
        const sessions = completedSessions.filter((s) => s.userId === user.id);
        const lastWorkout = sessions.reduce<Date | null>(
            (latest, s) => (latest === null || s.completedAt > latest ? s.completedAt : latest),
            null
        );
        const openSession = openSessions
            .filter((s) => s.userId === user.id)
            .reduce<Date | null>((latest, s) => (latest === null || s.startedAt > latest ? s.startedAt : latest), null);
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
            openSessionStartedAt: openSession?.toISOString() ?? null,
            totalSessions: sessions.length,
            sessions28d: sessions.filter((s) => isWithin(s.completedAt, 28)).length,
            features: FEATURE_ORDER.filter((feature) => enabled[feature]),
        };
    });

    // As datas estão em ISO, então a ordem do texto é a ordem do tempo.
    const lastActivity = (row: AdminUserRow) =>
        (row.lastWorkoutAt ?? "") > (row.openSessionStartedAt ?? "")
            ? row.lastWorkoutAt ?? ""
            : row.openSessionStartedAt ?? "";

    userRows.sort((a, b) =>
        lastActivity(b).localeCompare(lastActivity(a)) || b.createdAt.localeCompare(a.createdAt)
    );

    return {
        summary: {
            users: users.length,
            active7d: usersWithin(7),
            active28d: usersWithin(28),
            sessionsThisWeek: weekly[weekly.length - 1].sessions,
            completionRate28d: completionRate(
                completedSessions.filter((s) => isWithin(s.startedAt, 28)).length,
                abandonedSessions.filter((s) => isWithin(s.startedAt, 28)).length
            ),
            usersWithOpenSession: new Set(openSessions.map((s) => s.userId)).size,
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
