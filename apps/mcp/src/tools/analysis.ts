import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { prisma } from "@plato/database";
import {
    calculateE1RM,
    calculateTotalVolume,
    setVolume,
    externalLoad,
    summarizePlannedVolume,
    findSinglePointMuscles,
    weeklyExposures,
    estimateSessionsPerWeek,
} from "@plato/shared";

export function registerAnalysisTools(server: McpServer, requireAuth: () => number) {
    server.registerTool(
        "analyze_session",
        {
            title: "Analyze Session",
            description:
                "Post-workout analysis of a completed session: total volume (kg), average RPE, duration, estimated 1RM per exercise, and set-by-set breakdown.",
            inputSchema: z.object({
                session_id: z.number().describe("Session ID to analyze"),
            }),
        },
        async ({ session_id }) => {
            const userId = requireAuth();

            const session = await prisma.workoutSession.findUnique({
                where: { id: session_id, userId },
                include: {
                    workout: { select: { id: true, name: true } },
                    sessionSet: {
                        orderBy: { setNumber: "asc" },
                        include: { exercise: true },
                    },
                },
            });

            if (!session) return { content: [{ type: "text" as const, text: "Session not found." }], isError: true };

            const totalVolume = calculateTotalVolume(session.sessionSet);

            const rpeValues = session.sessionSet.filter((s) => s.rpe != null).map((s) => s.rpe!);
            const averageRpe = rpeValues.length > 0 ? Math.round((rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length) * 10) / 10 : null;

            let durationMinutes: number | null = null;
            if (session.completedAt) {
                durationMinutes = Math.round((session.completedAt.getTime() - session.startedAt.getTime()) / 60000);
            }

            const exerciseMap = new Map<number, { name: string; sets: typeof session.sessionSet }>();
            for (const set of session.sessionSet) {
                if (!exerciseMap.has(set.exerciseId)) {
                    exerciseMap.set(set.exerciseId, { name: set.exercise.name, sets: [] });
                }
                exerciseMap.get(set.exerciseId)!.sets.push(set);
            }

            const exerciseSummaries = Array.from(exerciseMap.entries()).map(([exerciseId, { name, sets }]) => {
                const bestSet = sets.reduce((best, s) => {
                    const load = externalLoad(s);
                    const bestLoad = externalLoad(best);
                    return load > bestLoad ? s : best;
                });

                const load = externalLoad(bestSet);
                const e1rm = load > 0 && bestSet.actualReps > 0 && bestSet.rpe != null
                    ? calculateE1RM(load, bestSet.actualReps, bestSet.rpe, bestSet.equipmentWeight ?? 0)
                    : null;

                const volume = sets.reduce((sum, s) => sum + setVolume(s), 0);

                return {
                    exerciseId,
                    name,
                    sets: sets.length,
                    volume: Math.round(volume),
                    bestSet: { weight: load, reps: bestSet.actualReps, rpe: bestSet.rpe },
                    estimatedE1RM: e1rm ? Math.round(e1rm * 10) / 10 : null,
                };
            });

            const result = {
                sessionId: session.id,
                workout: session.workout?.name ?? "Unknown",
                date: session.startedAt.toISOString().split("T")[0],
                durationMinutes,
                totalVolume: Math.round(totalVolume),
                totalSets: session.sessionSet.length,
                averageRpe,
                exercises: exerciseSummaries,
            };

            return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.registerTool(
        "analyze_workout_volume",
        {
            title: "Analyze Workout Volume",
            description:
                "Analyze planned volume per muscle group for a workout or all active workouts. Shows sets per muscle, single points of failure (muscle served by only one workout), and estimated weekly exposures.",
            inputSchema: z.object({
                workout_id: z.number().optional().describe("Specific workout ID. If omitted, analyzes all active workouts."),
            }),
        },
        async ({ workout_id }) => {
            const userId = requireAuth();

            const workouts = await prisma.workout.findMany({
                where: { userId, ...(workout_id ? { id: workout_id } : { isActive: true }) },
                include: {
                    workoutExercise: {
                        include: { exercise: { select: { id: true, name: true, targetMuscle: true } } },
                    },
                },
            });

            if (workouts.length === 0) {
                return { content: [{ type: "text" as const, text: "No workouts found." }], isError: true };
            }

            const planned = workouts.map((w) => ({
                id: w.id,
                name: w.name,
                exercises: w.workoutExercise.map((we) => ({
                    name: we.exercise.name,
                    targetMuscle: we.exercise.targetMuscle,
                    targetSets: we.targetSets,
                })),
            }));

            const volumeByMuscle = summarizePlannedVolume(planned);
            const singlePoints = findSinglePointMuscles(volumeByMuscle, workouts.length);

            const sessions = await prisma.workoutSession.findMany({
                where: { userId, completedAt: { not: null } },
                orderBy: { completedAt: "desc" },
                take: 30,
                select: { completedAt: true },
            });

            const sessionsPerWeek = estimateSessionsPerWeek(sessions.map((s) => s.completedAt!));

            const exposures = sessionsPerWeek != null
                ? volumeByMuscle.map((v) => ({
                    muscle: v.muscle,
                    exposuresPerWeek: Math.round(weeklyExposures(v.workoutIds.length, sessionsPerWeek, workouts.length) * 10) / 10,
                }))
                : null;

            const result = {
                workouts: planned.map((w) => ({ id: w.id, name: w.name, exerciseCount: w.exercises.length })),
                volumeByMuscle,
                singlePointsOfFailure: singlePoints,
                estimatedSessionsPerWeek: sessionsPerWeek,
                estimatedWeeklyExposures: exposures,
            };

            return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
        }
    );
}
