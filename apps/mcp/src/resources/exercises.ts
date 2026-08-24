import { McpServer } from "@modelcontextprotocol/server";
import { prisma } from "@plato/database";

export function registerExerciseResource(server: McpServer) {
    server.registerResource(
        "exercises",
        "plato://exercises",
        {
            title: "Exercise Catalog",
            description: "Complete catalog of active exercises with ID, name, target muscle, load type, equipment, and movement pattern.",
            mimeType: "application/json",
        },
        async (uri) => {
            const exercises = await prisma.exercise.findMany({
                where: { deprecated: false },
                orderBy: { name: "asc" },
                select: {
                    id: true,
                    name: true,
                    targetMuscle: true,
                    secondaryMuscles: true,
                    loadType: true,
                    equipment: true,
                    movementPattern: true,
                    repUnit: true,
                },
            });

            return {
                contents: [
                    {
                        uri: uri.href,
                        text: JSON.stringify(exercises, null, 2),
                        mimeType: "application/json",
                    },
                ],
            };
        }
    );
}
