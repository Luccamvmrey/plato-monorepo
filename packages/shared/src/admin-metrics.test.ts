import { describe, expect, it } from "vitest";
import { buildAdminMetrics, type AdminMetricsInput } from "./admin-metrics";

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
    buildAdminMetrics({ users: [], completedSessions: [], copiedPlanUserIds: [], pushLogs: [], ...overrides }, NOW);

describe("buildAdminMetrics: resumo", () => {
    it("conta pessoas distintas nas janelas de 7 e 28 dias", () => {
        const { summary } = build({
            users: [user(1), user(2), user(3), user(4)],
            completedSessions: [
                { userId: 1, completedAt: daysAgo(1) },
                { userId: 1, completedAt: daysAgo(2) },
                { userId: 2, completedAt: daysAgo(20) },
                { userId: 3, completedAt: daysAgo(40) },
            ],
        });

        expect(summary).toMatchObject({ users: 4, active7d: 1, active28d: 2 });
    });

    it("funciona sem nenhum dado", () => {
        expect(build({}).summary).toEqual({ users: 0, active7d: 0, active28d: 0, sessionsThisWeek: 0 });
    });
});

describe("buildAdminMetrics: semanas", () => {
    it("devolve 12 semanas em ordem, terminando na atual, mesmo sem dados", () => {
        const { weekly } = build({});

        expect(weekly).toHaveLength(12);
        expect(weekly[0].weekStart).toBe("2026-08-17");
        expect(weekly[11]).toEqual({ weekStart: "2026-11-02", activeUsers: 0, sessions: 0, signups: 0 });
    });

    it("separa sessões, pessoas ativas e cadastros por semana", () => {
        const { weekly, summary } = build({
            users: [user(1), user(2, { createdAt: daysAgo(1) })],
            completedSessions: [
                { userId: 1, completedAt: daysAgo(1) },
                { userId: 1, completedAt: daysAgo(2) },
                { userId: 2, completedAt: daysAgo(1) },
                { userId: 1, completedAt: daysAgo(7) },
            ],
        });

        expect(weekly[11]).toEqual({ weekStart: "2026-11-02", activeUsers: 2, sessions: 3, signups: 1 });
        expect(weekly[10]).toEqual({ weekStart: "2026-10-26", activeUsers: 1, sessions: 1, signups: 0 });
        expect(summary.sessionsThisWeek).toBe(3);
    });

    it("usa o dia de São Paulo: domingo à noite ainda é a semana que termina", () => {
        // Domingo, 01/11, às 22h em São Paulo. Em UTC já é segunda, 02/11.
        const { weekly } = build({
            completedSessions: [{ userId: 1, completedAt: new Date("2026-11-02T01:00:00Z") }],
        });

        expect(weekly[10].sessions).toBe(1);
        expect(weekly[11].sessions).toBe(0);
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
                { userId: 3, completedAt: daysAgo(10) },
                { userId: 4, completedAt: daysAgo(30) },
                { userId: 4, completedAt: daysAgo(2) },
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
