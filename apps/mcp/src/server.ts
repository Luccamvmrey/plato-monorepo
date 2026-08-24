import { McpServer } from "@modelcontextprotocol/server";
import { registerAuthTools } from "./tools/auth.js";
import { registerProfileTools } from "./tools/profile.js";
import { registerExerciseTools } from "./tools/exercises.js";
import { registerWorkoutTools } from "./tools/workouts.js";
import { registerProgramTools } from "./tools/programs.js";
import { registerSessionTools } from "./tools/sessions.js";
import { registerRecordTools } from "./tools/records.js";
import { registerBodyWeightTools } from "./tools/body-weight.js";
import { registerAnalysisTools } from "./tools/analysis.js";
import { registerExerciseResource } from "./resources/exercises.js";

export function buildServer(): McpServer {
    const server = new McpServer({
        name: "plato",
        version: "1.0.0",
    });

    let userId: number | null = null;

    const setUserId = (id: number) => {
        userId = id;
    };

    const requireAuth = (): number => {
        if (userId === null) {
            throw new Error("Not authenticated. Call the login tool first.");
        }
        return userId;
    };

    registerAuthTools(server, setUserId);
    registerProfileTools(server, requireAuth);
    registerExerciseTools(server, requireAuth);
    registerWorkoutTools(server, requireAuth);
    registerProgramTools(server, requireAuth);
    registerSessionTools(server, requireAuth);
    registerRecordTools(server, requireAuth);
    registerBodyWeightTools(server, requireAuth);
    registerAnalysisTools(server, requireAuth);
    registerExerciseResource(server);

    return server;
}

export function isInitializeRequest(body: unknown): boolean {
    if (typeof body !== "object" || body === null) return false;
    return (body as Record<string, unknown>).method === "initialize";
}
