import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { prisma } from "@plato/database";

const PROGRAM_INCLUDE = {
    programWorkout: {
        orderBy: { orderIndex: "asc" as const },
        include: { workout: true },
    },
} as const;

export function registerProgramTools(server: McpServer, requireAuth: () => number) {
    server.registerTool(
        "list_programs",
        {
            title: "List Programs",
            description: "List all training programs. A program is an ordered cycle of workouts.",
            inputSchema: z.object({}),
        },
        async () => {
            const userId = requireAuth();

            const programs = await prisma.program.findMany({
                where: { userId },
                orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
                include: PROGRAM_INCLUDE,
            });

            return { content: [{ type: "text" as const, text: JSON.stringify(programs, null, 2) }] };
        }
    );

    server.registerTool(
        "get_active_program",
        {
            title: "Get Active Program",
            description: "Get the active training program with the suggested next workout in the rotation cycle, cycle positions, and last-completed dates.",
            inputSchema: z.object({}),
        },
        async () => {
            const userId = requireAuth();

            const program = await prisma.program.findFirst({
                where: { userId, isActive: true },
                include: PROGRAM_INCLUDE,
            });

            if (!program) {
                return { content: [{ type: "text" as const, text: "No active program." }] };
            }

            const entries = program.programWorkout;
            if (entries.length === 0) {
                return { content: [{ type: "text" as const, text: JSON.stringify({ program: { id: program.id, name: program.name }, next: null, cycle: [] }, null, 2) }] };
            }

            const workoutIds = entries.map((e) => e.workoutId);

            const lastSession = await prisma.workoutSession.findFirst({
                where: { userId, programId: program.id, completedAt: { not: null }, workoutId: { in: workoutIds } },
                orderBy: { completedAt: "desc" },
                select: { id: true, workoutId: true, completedAt: true },
            });

            const lastByWorkout = await prisma.workoutSession.groupBy({
                by: ["workoutId"],
                where: { userId, completedAt: { not: null }, workoutId: { in: workoutIds } },
                _max: { completedAt: true },
            });

            const lastCompletedByWorkout = new Map(lastByWorkout.map((r) => [r.workoutId, r._max.completedAt]));

            const lastIndex = lastSession ? entries.findIndex((e) => e.workoutId === lastSession.workoutId) : -1;
            const nextIndex = lastIndex === -1 ? 0 : (lastIndex + 1) % entries.length;

            const result = {
                program: { id: program.id, name: program.name, description: program.description, isActive: program.isActive },
                next: { workoutId: entries[nextIndex].workoutId, name: entries[nextIndex].workout.name, position: nextIndex + 1 },
                total: entries.length,
                lastCompleted: lastSession
                    ? { sessionId: lastSession.id, workoutId: lastSession.workoutId, completedAt: lastSession.completedAt }
                    : null,
                cycle: entries.map((entry, i) => ({
                    workoutId: entry.workoutId,
                    name: entry.workout.name,
                    position: i + 1,
                    isNext: i === nextIndex,
                    lastCompletedAt: lastCompletedByWorkout.get(entry.workoutId) ?? null,
                })),
            };

            return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.registerTool(
        "create_program",
        {
            title: "Create Program",
            description: "Create a training program with an ordered cycle of workouts. Use list_workouts to find workout IDs.",
            inputSchema: z.object({
                name: z.string().describe("Program name"),
                description: z.string().optional().describe("Program description"),
                workout_ids: z.array(z.number()).describe("Ordered list of workout IDs forming the rotation cycle"),
            }),
        },
        async ({ name, description, workout_ids }) => {
            const userId = requireAuth();

            const userWorkouts = await prisma.workout.findMany({
                where: { id: { in: workout_ids }, userId },
                select: { id: true },
            });
            const ownedIds = new Set(userWorkouts.map((w) => w.id));
            const notOwned = workout_ids.filter((id) => !ownedIds.has(id));
            if (notOwned.length > 0) {
                return { content: [{ type: "text" as const, text: `Workouts not found or not owned: ${notOwned.join(", ")}` }], isError: true };
            }

            const program = await prisma.program.create({
                data: {
                    name,
                    description: description ?? null,
                    user: { connect: { id: userId } },
                    programWorkout: {
                        create: workout_ids.map((workoutId, i) => ({ workoutId, orderIndex: i + 1 })),
                    },
                },
                include: PROGRAM_INCLUDE,
            });

            return { content: [{ type: "text" as const, text: JSON.stringify(program, null, 2) }] };
        }
    );

    server.registerTool(
        "update_program",
        {
            title: "Update Program",
            description: "Update a program's name and/or workout cycle. Workout IDs replace the entire cycle.",
            inputSchema: z.object({
                program_id: z.number().describe("Program ID to update"),
                name: z.string().optional().describe("New name"),
                description: z.string().optional().describe("New description"),
                workout_ids: z.array(z.number()).describe("Complete ordered list of workout IDs (replaces existing cycle)"),
            }),
        },
        async ({ program_id, name, description, workout_ids }) => {
            const userId = requireAuth();

            const existing = await prisma.program.findUnique({ where: { id: program_id } });
            if (!existing || existing.userId !== userId) {
                return { content: [{ type: "text" as const, text: "Program not found or not owned by user." }], isError: true };
            }

            const userWorkouts = await prisma.workout.findMany({ where: { id: { in: workout_ids }, userId }, select: { id: true } });
            const ownedIds = new Set(userWorkouts.map((w) => w.id));
            const notOwned = workout_ids.filter((id) => !ownedIds.has(id));
            if (notOwned.length > 0) {
                return { content: [{ type: "text" as const, text: `Workouts not found or not owned: ${notOwned.join(", ")}` }], isError: true };
            }

            const updated = await prisma.$transaction(async (tx) => {
                await tx.programWorkout.deleteMany({ where: { programId: program_id } });
                await tx.program.update({
                    where: { id: program_id },
                    data: {
                        ...(name !== undefined ? { name } : {}),
                        ...(description !== undefined ? { description } : {}),
                    },
                });
                await tx.programWorkout.createMany({
                    data: workout_ids.map((workoutId, i) => ({ programId: program_id, workoutId, orderIndex: i + 1 })),
                });
                return tx.program.findUniqueOrThrow({ where: { id: program_id }, include: PROGRAM_INCLUDE });
            });

            return { content: [{ type: "text" as const, text: JSON.stringify(updated, null, 2) }] };
        }
    );

    server.registerTool(
        "activate_program",
        {
            title: "Activate Program",
            description: "Activate a program (deactivates all others). Only one program can be active at a time.",
            inputSchema: z.object({
                program_id: z.number().describe("Program ID to activate"),
            }),
        },
        async ({ program_id }) => {
            const userId = requireAuth();

            const existing = await prisma.program.findUnique({ where: { id: program_id } });
            if (!existing || existing.userId !== userId) {
                return { content: [{ type: "text" as const, text: "Program not found or not owned by user." }], isError: true };
            }

            const activated = await prisma.$transaction(async (tx) => {
                await tx.program.updateMany({
                    where: { userId, isActive: true, id: { not: program_id } },
                    data: { isActive: false },
                });
                return tx.program.update({
                    where: { id: program_id },
                    data: { isActive: true },
                    include: PROGRAM_INCLUDE,
                });
            });

            return { content: [{ type: "text" as const, text: JSON.stringify(activated, null, 2) }] };
        }
    );
}
