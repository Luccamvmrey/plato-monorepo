import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { prisma } from "@plato/database";
import { calculateTotalVolume, setVolume } from "@plato/shared";

export function registerProfileTools(server: McpServer, requireAuth: () => number) {
    server.registerTool(
        "get_profile",
        {
            title: "Get Profile",
            description: "Get user profile with summary stats: total sessions, lifetime volume, and total PRs.",
            inputSchema: z.object({}),
        },
        async () => {
            const userId = requireAuth();

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, name: true, email: true, createdAt: true },
            });

            const totalSessions = await prisma.workoutSession.count({
                where: { userId, completedAt: { not: null } },
            });

            const sessionSets = await prisma.sessionSet.findMany({
                where: { workoutSession: { userId } },
                select: { actualWeight: true, actualReps: true, equipmentWeight: true },
            });

            const lifetimeVolume = calculateTotalVolume(sessionSets);

            const prExercises = await prisma.personalRecord.findMany({
                where: { userId },
                distinct: ["exerciseId"],
                select: { exerciseId: true },
            });

            return {
                content: [{ type: "text" as const, text: JSON.stringify({ ...user, totalSessions, lifetimeVolume, totalPRs: prExercises.length }, null, 2) }],
            };
        }
    );

    server.registerTool(
        "get_stats",
        {
            title: "Get Training Stats",
            description: "Training analytics: peak strength per muscle group, volume leaders, and training distribution (% of sets per muscle).",
            inputSchema: z.object({}),
        },
        async () => {
            const userId = requireAuth();

            const records = await prisma.personalRecord.findMany({
                where: { userId, type: "WEIGHT" },
                include: { exercise: true },
            });

            const peakStrength: Record<string, number> = {};
            for (const r of records) {
                const muscle = r.exercise.targetMuscle;
                if (!peakStrength[muscle] || r.value > peakStrength[muscle]) {
                    peakStrength[muscle] = r.value;
                }
            }

            const allSets = await prisma.sessionSet.findMany({
                where: { workoutSession: { userId } },
                include: { exercise: true },
            });

            const exerciseVolume: Record<number, { name: string; muscle: string; volume: number }> = {};
            for (const set of allSets) {
                if (!exerciseVolume[set.exerciseId]) {
                    exerciseVolume[set.exerciseId] = { name: set.exercise.name, muscle: set.exercise.targetMuscle, volume: 0 };
                }
                exerciseVolume[set.exerciseId].volume += setVolume(set);
            }

            const volumeLeaders: Record<string, { name: string; volume: number }> = {};
            for (const ev of Object.values(exerciseVolume)) {
                if (!volumeLeaders[ev.muscle] || ev.volume > volumeLeaders[ev.muscle].volume) {
                    volumeLeaders[ev.muscle] = { name: ev.name, volume: ev.volume };
                }
            }

            const totalSets = allSets.length;
            const muscleFreq: Record<string, number> = {};
            for (const set of allSets) {
                const m = set.exercise.targetMuscle;
                muscleFreq[m] = (muscleFreq[m] || 0) + 1;
            }
            const distribution = Object.entries(muscleFreq).map(([muscle, count]) => ({
                muscle,
                percentage: totalSets > 0 ? Math.round((count / totalSets) * 1000) / 10 : 0,
            }));

            return {
                content: [{ type: "text" as const, text: JSON.stringify({ peakStrength, volumeLeaders, distribution }, null, 2) }],
            };
        }
    );

    server.registerTool(
        "get_streak",
        {
            title: "Get Training Streak",
            description: "Current training streak (sessions on consecutive training days, allowing up to 2 rest days per week) and this week's day-by-day status.",
            inputSchema: z.object({
                timezone: z.string().optional().describe("IANA timezone (e.g. 'America/Sao_Paulo'). Defaults to UTC."),
            }),
        },
        async ({ timezone }) => {
            const userId = requireAuth();
            const tz = timezone ?? "UTC";

            const sessions = await prisma.workoutSession.findMany({
                where: { userId, completedAt: { not: null } },
                select: { completedAt: true },
            });

            const toDateStr = (date: Date) =>
                new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);

            const addDays = (dateStr: string, days: number): string => {
                const [y, m, d] = dateStr.split("-").map(Number);
                return new Date(Date.UTC(y, m - 1, d + days)).toISOString().split("T")[0];
            };

            const getMondayOf = (date: Date): string => {
                const localDateStr = toDateStr(date);
                const [y, m, d] = localDateStr.split("-").map(Number);
                const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
                return addDays(localDateStr, dow === 0 ? -6 : 1 - dow);
            };

            const getDaysBetween = (start: string, end: string): string[] => {
                const days: string[] = [];
                let cur = start;
                while (cur <= end) { days.push(cur); cur = addDays(cur, 1); }
                return days;
            };

            const trainedDates = new Set(sessions.map((s) => toDateStr(s.completedAt!)));
            const now = new Date();
            const today = toDateStr(now);
            const weekMondayStr = getMondayOf(now);

            const weekDays = Array.from({ length: 7 }, (_, i) => {
                const dateStr = addDays(weekMondayStr, i);
                const status = trainedDates.has(dateStr) ? "trained" : dateStr < today ? "rest_used" : "future";
                return { date: dateStr, dayOfWeek: i, status };
            });

            if (trainedDates.size === 0) {
                return { content: [{ type: "text" as const, text: JSON.stringify({ currentStreak: 0, restDaysUsedThisWeek: 0, weekDays }, null, 2) }] };
            }

            let streak = 0;
            let restDaysUsedThisWeek = 0;
            let isFirstWeek = true;
            let weekStartStr = weekMondayStr;

            while (true) {
                const weekSundayStr = addDays(weekStartStr, 6);
                const upperBoundStr = isFirstWeek ? today : weekSundayStr;
                const days = getDaysBetween(weekStartStr, upperBoundStr);
                const trained = days.filter((d) => trainedDates.has(d));
                let notTrained = days.filter((d) => !trainedDates.has(d));

                if (isFirstWeek && !trainedDates.has(today)) {
                    notTrained = notTrained.filter((d) => d !== today);
                }

                if (notTrained.length > 2) break;
                if (trained.length === 0 && !isFirstWeek) break;

                streak += trained.length;
                if (isFirstWeek) {
                    restDaysUsedThisWeek = notTrained.length;
                    isFirstWeek = false;
                }
                weekStartStr = addDays(weekStartStr, -7);
            }

            return {
                content: [{ type: "text" as const, text: JSON.stringify({ currentStreak: streak, restDaysUsedThisWeek, weekDays }, null, 2) }],
            };
        }
    );
}
