import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { prisma, MuscleGroup } from "@plato/database";

type AlternativeReason =
    | "SAME_PATTERN_SAME_EQUIPMENT"
    | "SAME_PATTERN_OTHER_EQUIPMENT"
    | "SAME_PATTERN_OTHER_MUSCLE"
    | "SAME_MUSCLE_OTHER_PATTERN";

const REASON_RANK: Record<AlternativeReason, number> = {
    SAME_PATTERN_SAME_EQUIPMENT: 0,
    SAME_PATTERN_OTHER_EQUIPMENT: 1,
    SAME_PATTERN_OTHER_MUSCLE: 2,
    SAME_MUSCLE_OTHER_PATTERN: 3,
};

export function registerExerciseTools(server: McpServer, requireAuth: () => number) {
    server.registerTool(
        "list_exercises",
        {
            title: "List Exercises",
            description: "List all active exercises in the catalog, optionally filtered by muscle group.",
            inputSchema: z.object({
                muscle_group: z.enum(Object.values(MuscleGroup) as [string, ...string[]]).optional()
                    .describe("Filter by target muscle group (e.g. CHEST, BACK, QUADRICEPS)"),
            }),
        },
        async ({ muscle_group }) => {
            requireAuth();

            const exercises = await prisma.exercise.findMany({
                where: {
                    deprecated: false,
                    ...(muscle_group ? { targetMuscle: muscle_group as typeof MuscleGroup[keyof typeof MuscleGroup] } : {}),
                },
                orderBy: { name: "asc" },
            });

            return { content: [{ type: "text" as const, text: JSON.stringify(exercises, null, 2) }] };
        }
    );

    server.registerTool(
        "get_exercise_alternatives",
        {
            title: "Get Exercise Alternatives",
            description: "Get ranked substitute exercises for a given exercise, based on movement pattern, equipment, and target muscle.",
            inputSchema: z.object({
                exercise_id: z.number().describe("ID of the exercise to find alternatives for"),
                limit: z.number().optional().describe("Max alternatives to return (default 8)"),
            }),
        },
        async ({ exercise_id, limit }) => {
            const userId = requireAuth();
            const maxResults = limit ?? 8;

            const target = await prisma.exercise.findUnique({ where: { id: exercise_id } });
            if (!target) return { content: [{ type: "text" as const, text: "Exercise not found." }], isError: true };

            const candidates = await prisma.exercise.findMany({
                where: {
                    deprecated: false,
                    id: { not: exercise_id },
                    OR: [
                        ...(target.movementPattern ? [{ movementPattern: target.movementPattern }] : []),
                        { targetMuscle: target.targetMuscle },
                    ],
                },
            });

            if (candidates.length === 0) return { content: [{ type: "text" as const, text: JSON.stringify({ target, alternatives: [] }, null, 2) }] };

            const history = await prisma.sessionSet.groupBy({
                by: ["exerciseId"],
                where: {
                    exerciseId: { in: candidates.map((c) => c.id) },
                    workoutSession: { userId },
                },
                _count: { _all: true },
            });

            const setsByExercise = new Map(history.map((r) => [r.exerciseId, r._count._all]));
            const patternIsBucket = target.movementPattern === "ISOLATION" || target.movementPattern === "CORE";

            const scored = candidates
                .map((candidate) => {
                    const samePattern = target.movementPattern !== null && candidate.movementPattern === target.movementPattern;
                    const sameMuscle = candidate.targetMuscle === target.targetMuscle;

                    let reason: AlternativeReason;
                    if (samePattern && sameMuscle) {
                        reason = candidate.equipment !== null && candidate.equipment === target.equipment
                            ? "SAME_PATTERN_SAME_EQUIPMENT"
                            : "SAME_PATTERN_OTHER_EQUIPMENT";
                    } else if (samePattern) {
                        reason = "SAME_PATTERN_OTHER_MUSCLE";
                    } else {
                        reason = "SAME_MUSCLE_OTHER_PATTERN";
                    }

                    return { ...candidate, reason, recordedSets: setsByExercise.get(candidate.id) ?? 0 };
                })
                .filter((c) => !(patternIsBucket && c.reason === "SAME_PATTERN_OTHER_MUSCLE"));

            scored.sort(
                (a, b) =>
                    REASON_RANK[a.reason] - REASON_RANK[b.reason] ||
                    b.recordedSets - a.recordedSets ||
                    a.name.localeCompare(b.name, "pt-BR")
            );

            return { content: [{ type: "text" as const, text: JSON.stringify({ target, alternatives: scored.slice(0, maxResults) }, null, 2) }] };
        }
    );
}
