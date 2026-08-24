import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { prisma } from "@plato/database";

export function registerBodyWeightTools(server: McpServer, requireAuth: () => number) {
    server.registerTool(
        "list_body_weight",
        {
            title: "List Body Weight",
            description: "List body weight log entries, newest first.",
            inputSchema: z.object({
                limit: z.number().optional().describe("Max entries to return"),
            }),
        },
        async ({ limit }) => {
            const userId = requireAuth();

            const logs = await prisma.bodyWeightLog.findMany({
                where: { userId },
                orderBy: { measuredAt: "desc" },
                ...(limit ? { take: limit } : {}),
            });

            return { content: [{ type: "text" as const, text: JSON.stringify(logs, null, 2) }] };
        }
    );

    server.registerTool(
        "log_body_weight",
        {
            title: "Log Body Weight",
            description: "Record a body weight measurement. Weight in kg.",
            inputSchema: z.object({
                weight: z.number().describe("Body weight in kg"),
                measured_at: z.string().optional().describe("Date of measurement (ISO 8601, e.g. '2026-08-23'). Defaults to now."),
            }),
        },
        async ({ weight, measured_at }) => {
            const userId = requireAuth();

            const log = await prisma.bodyWeightLog.create({
                data: {
                    userId,
                    weight,
                    measuredAt: measured_at ? new Date(measured_at) : new Date(),
                },
            });

            return { content: [{ type: "text" as const, text: JSON.stringify(log, null, 2) }] };
        }
    );
}
