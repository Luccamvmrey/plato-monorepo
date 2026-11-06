import prisma from "@plato/database";
import { buildAdminMetrics } from "@plato/shared";

/** Só leitura. Traz o nome para o painel, e de propósito não traz e-mail nem dado de treino. */
const getMetrics = async () => {
    const [users, completedSessions, copiedPlans, pushLogs] = await Promise.all([
        prisma.user.findMany({
            select: {
                id: true,
                name: true,
                createdAt: true,
                trackingMode: true,
                _count: {
                    select: {
                        program: { where: { isActive: true } },
                        pushSubscription: true,
                        sharedPlan: true,
                        bodyWeightLog: true,
                        oauthSession: true,
                    },
                },
            },
        }),
        prisma.workoutSession.findMany({
            where: { completedAt: { not: null } },
            select: { userId: true, completedAt: true },
        }),
        prisma.workout.findMany({
            where: { sourcePlanId: { not: null } },
            distinct: ["userId"],
            select: { userId: true },
        }),
        prisma.notificationLog.findMany({
            where: { channel: "PUSH" },
            select: { kind: true, status: true, openedAt: true },
        }),
    ]);

    return buildAdminMetrics(
        {
            users: users.map(({ _count, ...user }) => ({
                ...user,
                activePrograms: _count.program,
                pushDevices: _count.pushSubscription,
                sharedLinks: _count.sharedPlan,
                bodyWeightLogs: _count.bodyWeightLog,
                mcpSessions: _count.oauthSession,
            })),
            completedSessions: completedSessions.map((session) => ({
                userId: session.userId,
                completedAt: session.completedAt!,
            })),
            copiedPlanUserIds: copiedPlans.map((workout) => workout.userId),
            pushLogs,
        },
        new Date()
    );
};

export { getMetrics };
