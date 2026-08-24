import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { prisma } from "@plato/database";

const SESSION_INCLUDE = {
    sessionSet: {
        include: { exercise: true },
    },
    sessionExercise: {
        orderBy: { orderIndex: "asc" as const },
        include: { exercise: true },
    },
} as const;

const SESSION_WITH_WORKOUT_INCLUDE = {
    workout: true,
    ...SESSION_INCLUDE,
} as const;

export function registerSessionTools(server: McpServer, requireAuth: () => number) {
    server.registerTool(
        "list_sessions",
        {
            title: "List Sessions",
            description: "List workout session history. Each session has sets with weight, reps, RPE, and exercise info.",
            inputSchema: z.object({
                workout_id: z.number().optional().describe("Filter by workout ID"),
                from: z.string().optional().describe("Start date filter (ISO 8601, e.g. '2026-01-01')"),
                to: z.string().optional().describe("End date filter (ISO 8601)"),
                limit: z.number().optional().describe("Max sessions to return (default 20)"),
            }),
        },
        async ({ workout_id, from, to, limit }) => {
            const userId = requireAuth();

            const sessions = await prisma.workoutSession.findMany({
                where: {
                    userId,
                    ...(workout_id ? { workoutId: workout_id } : {}),
                    ...(from || to
                        ? {
                            startedAt: {
                                ...(from ? { gte: new Date(from) } : {}),
                                ...(to ? { lte: new Date(to) } : {}),
                            },
                        }
                        : {}),
                },
                orderBy: { startedAt: "desc" },
                take: limit ?? 20,
                include: SESSION_WITH_WORKOUT_INCLUDE,
            });

            return { content: [{ type: "text" as const, text: JSON.stringify(sessions, null, 2) }] };
        }
    );

    server.registerTool(
        "get_session",
        {
            title: "Get Session",
            description: "Get full details of a specific workout session, including all sets and exercise snapshots.",
            inputSchema: z.object({
                session_id: z.number().describe("Session ID"),
            }),
        },
        async ({ session_id }) => {
            const userId = requireAuth();

            const session = await prisma.workoutSession.findUnique({
                where: { id: session_id, userId },
                include: SESSION_WITH_WORKOUT_INCLUDE,
            });

            if (!session) return { content: [{ type: "text" as const, text: "Session not found." }], isError: true };
            return { content: [{ type: "text" as const, text: JSON.stringify(session, null, 2) }] };
        }
    );

    server.registerTool(
        "get_active_session",
        {
            title: "Get Active Session",
            description: "Get the current open (in-progress) session, if any, along with the last completed session of the same workout for comparison.",
            inputSchema: z.object({}),
        },
        async () => {
            const userId = requireAuth();

            const activeSession = await prisma.workoutSession.findFirst({
                where: { userId, completedAt: null },
                include: SESSION_INCLUDE,
            });

            if (!activeSession) {
                return { content: [{ type: "text" as const, text: "No active session." }] };
            }

            const lastSession = await prisma.workoutSession.findFirst({
                where: { userId, workoutId: activeSession.workoutId, completedAt: { not: null } },
                orderBy: { completedAt: "desc" },
                include: SESSION_INCLUDE,
            });

            return { content: [{ type: "text" as const, text: JSON.stringify({ activeSession, lastSession }, null, 2) }] };
        }
    );

    server.registerTool(
        "get_exercise_history",
        {
            title: "Get Exercise History",
            description: "Get the last N executions of a specific exercise across all sessions. Useful for analyzing load progression.",
            inputSchema: z.object({
                exercise_id: z.number().describe("Exercise ID"),
                limit: z.number().optional().describe("Number of sessions to look back (default 6)"),
            }),
        },
        async ({ exercise_id, limit }) => {
            const userId = requireAuth();
            const take = limit ?? 6;

            const sessions = await prisma.workoutSession.findMany({
                where: {
                    userId,
                    completedAt: { not: null },
                    sessionSet: { some: { exerciseId: exercise_id } },
                },
                orderBy: { completedAt: "desc" },
                take,
                select: {
                    id: true,
                    completedAt: true,
                    workout: { select: { id: true, name: true } },
                    sessionSet: {
                        where: { exerciseId: exercise_id, excludedFromRecords: false },
                        orderBy: { setNumber: "asc" },
                        select: {
                            setNumber: true,
                            actualReps: true,
                            actualWeight: true,
                            equipmentWeight: true,
                            rpe: true,
                        },
                    },
                },
            });

            return { content: [{ type: "text" as const, text: JSON.stringify(sessions, null, 2) }] };
        }
    );
}
