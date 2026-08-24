import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { prisma } from "@plato/database";

export function registerRecordTools(server: McpServer, requireAuth: () => number) {
    server.registerTool(
        "list_personal_records",
        {
            title: "List Personal Records",
            description: "List all personal records (WEIGHT and VOLUME) for all exercises.",
            inputSchema: z.object({}),
        },
        async () => {
            const userId = requireAuth();

            const records = await prisma.personalRecord.findMany({
                where: { userId },
                include: { exercise: { select: { id: true, name: true, targetMuscle: true } } },
                orderBy: { date: "desc" },
            });

            return { content: [{ type: "text" as const, text: JSON.stringify(records, null, 2) }] };
        }
    );

    server.registerTool(
        "get_exercise_records",
        {
            title: "Get Exercise Records",
            description: "Get personal records for a specific exercise (WEIGHT = heaviest effective load, VOLUME = highest session volume).",
            inputSchema: z.object({
                exercise_id: z.number().describe("Exercise ID"),
            }),
        },
        async ({ exercise_id }) => {
            const userId = requireAuth();

            const records = await prisma.personalRecord.findMany({
                where: { userId, exerciseId: exercise_id },
                include: { exercise: { select: { id: true, name: true, targetMuscle: true } } },
            });

            if (records.length === 0) {
                return { content: [{ type: "text" as const, text: "No records for this exercise." }] };
            }

            return { content: [{ type: "text" as const, text: JSON.stringify(records, null, 2) }] };
        }
    );
}
