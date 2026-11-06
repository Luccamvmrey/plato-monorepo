import { describe, expect, it } from "vitest";
import { buildAdminMetrics, filterAdminUsers, type AdminMetricsInput, type AdminUserFilters } from "./admin-metrics";

// Quinta-feira, 05/11/2026, ao meio-dia em São Paulo.
const NOW = new Date("2026-11-05T15:00:00Z");

const daysAgo = (days: number) => new Date(NOW.getTime() - days * 86_400_000);

const user = (id: number, overrides: Partial<AdminMetricsInput["users"][number]> = {}) => ({
    id,
    name: `Pessoa ${id}`,
    createdAt: daysAgo(100),
    trackingMode: "FULL" as const,
    activePrograms: 0,
    pushDevices: 0,
    sharedLinks: 0,
    bodyWeightLogs: 0,
    mcpSessions: 0,
    ...overrides,
});

const build = (overrides: Partial<AdminMetricsInput>) =>
    buildAdminMetrics(
        { users: [], completedSessions: [], openSessions: [], copiedPlanUserIds: [], pushLogs: [], ...overrides },
        NOW
    );

describe("buildAdminMetrics: resumo", () => {
    it("conta pessoas distintas nas janelas de 7 e 28 dias", () => {
        const { summary } = build({
            users: [user(1), user(2), user(3), user(4)],
            completedSessions: [
                { userId: 1, startedAt: daysAgo(1), completedAt: daysAgo(1) },
                { userId: 1, startedAt: daysAgo(2), completedAt: daysAgo(2) },
                { userId: 2, startedAt: daysAgo(20), completedAt: daysAgo(20) },
                { userId: 3, startedAt: daysAgo(40), completedAt: daysAgo(40) },
            ],
        });

        expect(summary).toMatchObject({ users: 4, active7d: 1, active28d: 2 });
    });

    it("funciona sem nenhum dado", () => {
        expect(build({}).summary).toEqual({
            users: 0,
            active7d: 0,
            active28d: 0,
            sessionsThisWeek: 0,
            completionRate28d: null,
            usersWithOpenSession: 0,
        });
    });
});

describe("buildAdminMetrics: semanas", () => {
    it("devolve 26 semanas em ordem, terminando na atual, mesmo sem dados", () => {
        const { weekly } = build({});

        expect(weekly).toHaveLength(26);
        expect(weekly[0].weekStart).toBe("2026-05-11");
        expect(weekly[25]).toEqual({
            weekStart: "2026-11-02",
            activeUsers: 0,
            sessions: 0,
            signups: 0,
            started: 0,
            startedAndCompleted: 0,
            completionRate: null,
        });
    });

    it("separa sessões, pessoas ativas e cadastros por semana", () => {
        const { weekly, summary } = build({
            users: [user(1), user(2, { createdAt: daysAgo(1) })],
            completedSessions: [
                { userId: 1, startedAt: daysAgo(1), completedAt: daysAgo(1) },
                { userId: 1, startedAt: daysAgo(2), completedAt: daysAgo(2) },
                { userId: 2, startedAt: daysAgo(1), completedAt: daysAgo(1) },
                { userId: 1, startedAt: daysAgo(7), completedAt: daysAgo(7) },
            ],
        });

        expect(weekly[25]).toMatchObject({ weekStart: "2026-11-02", activeUsers: 2, sessions: 3, signups: 1 });
        expect(weekly[24]).toMatchObject({ weekStart: "2026-10-26", activeUsers: 1, sessions: 1, signups: 0 });
        expect(summary.sessionsThisWeek).toBe(3);
    });

    it("usa o dia de São Paulo: domingo à noite ainda é a semana que termina", () => {
        // Domingo, 01/11, às 22h em São Paulo. Em UTC já é segunda, 02/11.
        const { weekly } = build({
            completedSessions: [{ userId: 1, startedAt: new Date("2026-11-02T01:00:00Z"), completedAt: new Date("2026-11-02T01:00:00Z") }],
        });

        expect(weekly[24].sessions).toBe(1);
        expect(weekly[25].sessions).toBe(0);
    });
});

describe("buildAdminMetrics: uso por pessoa", () => {
    it("marca o que cada pessoa usa e soma por recurso, do mais usado para o menos usado", () => {
        const { users, features } = build({
            users: [
                user(1, { activePrograms: 1, pushDevices: 2, mcpSessions: 1 }),
                user(2, { trackingMode: "SIMPLE", pushDevices: 1, sharedLinks: 3, bodyWeightLogs: 1 }),
            ],
            copiedPlanUserIds: [2],
        });

        expect(users.find((u) => u.id === 1)?.features).toEqual(["PROGRAM", "PUSH", "MCP"]);
        expect(users.find((u) => u.id === 2)?.features).toEqual([
            "SIMPLE_MODE",
            "PUSH",
            "SHARED_LINK",
            "COPIED_PLAN",
            "BODY_WEIGHT",
        ]);
        expect(features[0]).toEqual({ feature: "PUSH", users: 2 });
        expect(features).toHaveLength(7);
    });

    it("ordena por último treino; quem nunca treinou fica no fim, do cadastro mais novo", () => {
        const { users } = build({
            users: [
                user(1, { createdAt: daysAgo(50) }),
                user(2, { createdAt: daysAgo(5) }),
                user(3),
                user(4),
            ],
            completedSessions: [
                { userId: 3, startedAt: daysAgo(10), completedAt: daysAgo(10) },
                { userId: 4, startedAt: daysAgo(30), completedAt: daysAgo(30) },
                { userId: 4, startedAt: daysAgo(2), completedAt: daysAgo(2) },
            ],
        });

        expect(users.map((u) => u.id)).toEqual([4, 3, 2, 1]);
        expect(users[0]).toMatchObject({
            lastWorkoutAt: daysAgo(2).toISOString(),
            totalSessions: 2,
            sessions28d: 1,
        });
        expect(users[3].lastWorkoutAt).toBeNull();
    });
});

describe("buildAdminMetrics: sessões abertas", () => {
    it("mostra a sessão aberta mais recente e não a conta como treino concluído", () => {
        const { users, summary } = build({
            users: [user(1)],
            openSessions: [
                { userId: 1, startedAt: daysAgo(30) },
                { userId: 1, startedAt: daysAgo(1) },
            ],
        });

        expect(users[0]).toMatchObject({
            openSessionStartedAt: daysAgo(1).toISOString(),
            lastWorkoutAt: null,
            totalSessions: 0,
        });
        expect(summary.active7d).toBe(0);
    });

    it("ordena pela atividade mais recente, concluída ou aberta", () => {
        const { users } = build({
            users: [user(1), user(2), user(3)],
            completedSessions: [{ userId: 1, startedAt: daysAgo(5), completedAt: daysAgo(5) }],
            openSessions: [{ userId: 2, startedAt: daysAgo(1) }],
        });

        expect(users.map((u) => u.id)).toEqual([2, 1, 3]);
    });
});

describe("buildAdminMetrics: taxa de conclusão", () => {
    it("divide os concluídos pelos iniciados na semana", () => {
        const { weekly, summary } = build({
            completedSessions: [
                { userId: 1, startedAt: daysAgo(1), completedAt: daysAgo(1) },
                { userId: 1, startedAt: daysAgo(2), completedAt: daysAgo(2) },
                { userId: 2, startedAt: daysAgo(3), completedAt: daysAgo(3) },
            ],
            openSessions: [{ userId: 3, startedAt: daysAgo(2) }],
        });

        expect(weekly[25]).toMatchObject({ started: 4, startedAndCompleted: 3, completionRate: 75 });
        expect(summary.completionRate28d).toBe(75);
        expect(summary.usersWithOpenSession).toBe(1);
    });

    it("não conta como desistência quem pode estar treinando agora", () => {
        const fiveHoursAgo = new Date(NOW.getTime() - 5 * 3_600_000);
        const { weekly, summary } = build({
            completedSessions: [{ userId: 1, startedAt: daysAgo(1), completedAt: daysAgo(1) }],
            openSessions: [{ userId: 2, startedAt: fiveHoursAgo }],
        });

        expect(weekly[25].completionRate).toBe(100);
        expect(summary.completionRate28d).toBe(100);
        // Continua aparecendo como treino em aberto, só não pesa na taxa.
        expect(summary.usersWithOpenSession).toBe(1);
    });

    it("conta na semana em que o treino começou, não na em que terminou", () => {
        // Começou domingo, 01/11, e só foi concluído na segunda, 02/11.
        const { weekly } = build({
            completedSessions: [{
                userId: 1,
                startedAt: new Date("2026-11-01T22:00:00Z"),
                completedAt: new Date("2026-11-02T12:00:00Z"),
            }],
        });

        expect(weekly[24]).toMatchObject({ started: 1, startedAndCompleted: 1, completionRate: 100, sessions: 0 });
        expect(weekly[25]).toMatchObject({ started: 0, startedAndCompleted: 0, completionRate: null, sessions: 1 });
    });

    it("não inventa 0% quando ninguém iniciou treino", () => {
        const { weekly, summary } = build({
            openSessions: [{ userId: 1, startedAt: daysAgo(60) }],
        });

        expect(weekly[25].completionRate).toBeNull();
        expect(summary.completionRate28d).toBeNull();
    });

    it("mostra 0% quando há treinos iniciados e nenhum concluído", () => {
        const { weekly } = build({ openSessions: [{ userId: 1, startedAt: daysAgo(1) }] });

        expect(weekly[25]).toMatchObject({ started: 1, startedAndCompleted: 0, completionRate: 0 });
    });
});

describe("filterAdminUsers", () => {
    const { users } = build({
        users: [
            user(1, { name: "João Ativo", activePrograms: 1 }),
            user(2, { name: "Parado Silva", pushDevices: 1 }),
            user(3, { name: "Marquinhos" }),
            user(4, { name: null }),
            user(5, { name: "Nova Conta", createdAt: daysAgo(2), activePrograms: 1 }),
        ],
        completedSessions: [
            { userId: 1, startedAt: daysAgo(3), completedAt: daysAgo(3) },
            { userId: 2, startedAt: daysAgo(60), completedAt: daysAgo(60) },
        ],
        openSessions: [{ userId: 3, startedAt: daysAgo(1) }],
    });

    const ids = (filters: Partial<AdminUserFilters>) =>
        filterAdminUsers(users, { status: "ALL", feature: "ALL", search: "", ...filters }, NOW)
            .map((u) => u.id)
            .sort();

    it("sem filtro, devolve todo mundo", () => {
        expect(ids({})).toEqual([1, 2, 3, 4, 5]);
    });

    it("separa as pessoas por situação", () => {
        expect(ids({ status: "ACTIVE" })).toEqual([1]);
        expect(ids({ status: "INACTIVE" })).toEqual([2]);
        expect(ids({ status: "OPEN_SESSION" })).toEqual([3]);
        expect(ids({ status: "NEW" })).toEqual([5]);
    });

    it("não trata quem tem treino aberto como quem nunca treinou", () => {
        expect(ids({ status: "NEVER_TRAINED" })).toEqual([4, 5]);
    });

    it("filtra por recurso e combina com a situação", () => {
        expect(ids({ feature: "PROGRAM" })).toEqual([1, 5]);
        expect(ids({ feature: "PROGRAM", status: "ACTIVE" })).toEqual([1]);
    });

    it("busca sem diferenciar maiúsculas e acentos, e pelo número da conta", () => {
        expect(ids({ search: "joao" })).toEqual([1]);
        expect(ids({ search: "  MARQUINHOS " })).toEqual([3]);
        expect(ids({ search: "#4" })).toEqual([4]);
        expect(ids({ search: "ninguém" })).toEqual([]);
    });
});

describe("buildAdminMetrics: notificações", () => {
    it("separa enviadas, falhas e abertas por tipo, sem contar as ainda em andamento", () => {
        const { notifications } = build({
            pushLogs: [
                { kind: "REMINDER", status: "SENT", openedAt: daysAgo(1) },
                { kind: "REMINDER", status: "SENT", openedAt: null },
                { kind: "REMINDER", status: "FAILED", openedAt: null },
                { kind: "REMINDER", status: "CLAIMED", openedAt: null },
                { kind: "WEEKLY_SUMMARY", status: "SENT", openedAt: null },
            ],
        });

        expect(notifications).toEqual([
            { kind: "REMINDER", sent: 2, failed: 1, opened: 1 },
            { kind: "WEEKLY_SUMMARY", sent: 1, failed: 0, opened: 0 },
            { kind: "MONTHLY_SUMMARY", sent: 0, failed: 0, opened: 0 },
        ]);
    });
});
