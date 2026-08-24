import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { prisma } from "@plato/database";
import { normalizeExerciseGroups } from "@plato/shared";
import type { ExerciseGroupType } from "@plato/database/generated/prisma/enums.js";

const WORKOUT_INCLUDE = {
    workoutExercise: {
        include: { exercise: true },
    },
} as const;

interface WorkoutExerciseInput {
    exerciseId: number;
    orderIndex: number;
    targetSets: number;
    targetReps: number;
    observations?: string | null;
    groupKey?: string | null;
    groupType?: string | null;
}

function toWorkoutExerciseRows(exercises: WorkoutExerciseInput[]) {
    return normalizeExerciseGroups(
        [...exercises]
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((ex) => ({
                exerciseId: ex.exerciseId,
                orderIndex: ex.orderIndex,
                targetSets: ex.targetSets,
                targetReps: ex.targetReps,
                observation: ex.observations ?? null,
                groupKey: ex.groupKey ?? null,
                groupType: (ex.groupType as ExerciseGroupType) ?? null,
            }))
    );
}

const exerciseSchema = z.object({
    exerciseId: z.number().describe("ID of the exercise"),
    orderIndex: z.number().describe("Position in the workout (1-based)"),
    targetSets: z.number().describe("Number of target sets"),
    targetReps: z.number().describe("Number of target reps per set"),
    observations: z.string().optional().describe("Notes for this exercise"),
    groupKey: z.string().optional().describe("Group key for supersets (exercises with same key are grouped)"),
    groupType: z.enum(["SUPERSET", "REST_PAUSE"]).optional().describe("Type of exercise group"),
});

export function registerWorkoutTools(server: McpServer, requireAuth: () => number) {
    server.registerTool(
        "list_workouts",
        {
            title: "List Workouts",
            description: "List user's workout plans with their exercises.",
            inputSchema: z.object({
                active_only: z.boolean().optional().describe("Filter to active workouts only"),
            }),
        },
        async ({ active_only }) => {
            const userId = requireAuth();

            const workouts = await prisma.workout.findMany({
                where: { userId, ...(active_only !== undefined ? { isActive: active_only } : {}) },
                include: WORKOUT_INCLUDE,
            });

            return { content: [{ type: "text" as const, text: JSON.stringify(workouts, null, 2) }] };
        }
    );

    server.registerTool(
        "get_workout",
        {
            title: "Get Workout",
            description: "Get details of a specific workout plan.",
            inputSchema: z.object({
                workout_id: z.number().describe("Workout ID"),
            }),
        },
        async ({ workout_id }) => {
            const userId = requireAuth();

            const workout = await prisma.workout.findUnique({
                where: { id: workout_id, userId },
                include: WORKOUT_INCLUDE,
            });

            if (!workout) return { content: [{ type: "text" as const, text: "Workout not found." }], isError: true };
            return { content: [{ type: "text" as const, text: JSON.stringify(workout, null, 2) }] };
        }
    );

    server.registerTool(
        "create_workout",
        {
            title: "Create Workout",
            description: "Create a new workout plan with exercises. Use list_exercises to find exercise IDs.",
            inputSchema: z.object({
                name: z.string().describe("Workout name (e.g. 'Treino A - Push')"),
                description: z.string().optional().describe("Workout description"),
                exercises: z.array(exerciseSchema).describe("List of exercises in the workout"),
            }),
        },
        async ({ name, description, exercises }) => {
            const userId = requireAuth();

            const rows = toWorkoutExerciseRows(exercises);
            const workout = await prisma.workout.create({
                data: {
                    name,
                    description: description ?? null,
                    user: { connect: { id: userId } },
                    workoutExercise: {
                        create: rows.map((r) => ({
                            exercise: { connect: { id: r.exerciseId } },
                            orderIndex: r.orderIndex,
                            targetSets: r.targetSets,
                            targetReps: r.targetReps,
                            observation: r.observation,
                            groupKey: r.groupKey,
                            groupType: r.groupType,
                        })),
                    },
                },
                include: WORKOUT_INCLUDE,
            });

            return { content: [{ type: "text" as const, text: JSON.stringify(workout, null, 2) }] };
        }
    );

    server.registerTool(
        "update_workout",
        {
            title: "Update Workout",
            description: "Update a workout plan. Replaces all exercises (send the full list, not just changes).",
            inputSchema: z.object({
                workout_id: z.number().describe("Workout ID to update"),
                name: z.string().optional().describe("New name"),
                description: z.string().optional().describe("New description"),
                exercises: z.array(exerciseSchema).describe("Complete list of exercises (replaces existing)"),
            }),
        },
        async ({ workout_id, name, description, exercises }) => {
            const userId = requireAuth();

            const existing = await prisma.workout.findUnique({ where: { id: workout_id } });
            if (!existing || existing.userId !== userId) {
                return { content: [{ type: "text" as const, text: "Workout not found or not owned by user." }], isError: true };
            }

            await prisma.$transaction(async (tx) => {
                await tx.workoutExercise.deleteMany({ where: { workoutId: workout_id } });
                await tx.workout.update({
                    where: { id: workout_id },
                    data: {
                        ...(name !== undefined ? { name } : {}),
                        ...(description !== undefined ? { description } : {}),
                    },
                });
                await tx.workoutExercise.createMany({
                    data: toWorkoutExerciseRows(exercises).map((row) => ({ workoutId: workout_id, ...row })),
                });
            });

            const updated = await prisma.workout.findUnique({ where: { id: workout_id }, include: WORKOUT_INCLUDE });
            return { content: [{ type: "text" as const, text: JSON.stringify(updated, null, 2) }] };
        }
    );
}
