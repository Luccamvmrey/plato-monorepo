import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import type { AuthInfo } from "@modelcontextprotocol/server";
import { bearerAuthChallengeResponse, verifyBearerToken } from "@modelcontextprotocol/server";
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import { buildServer, isInitializeRequest } from "./server.js";
import { readBody, sendJson, sendWebResponse } from "./http.js";
import { MCP_PATH, PORT, RESOURCE_METADATA_URL } from "./oauth/config.js";
import { handleOAuthRoute } from "./oauth/routes.js";
import { tokenVerifier, userIdOf } from "./oauth/store.js";

// Cada sessão MCP pertence ao usuário que a abriu; o token é revalidado a cada request.
const sessions = new Map<string, { transport: NodeStreamableHTTPServerTransport; userId: number }>();

const bearerOptions = { verifier: tokenVerifier, resourceMetadataUrl: RESOURCE_METADATA_URL };

const jsonRpcError = (res: ServerResponse, status: number, code: number, message: string) =>
    sendJson(res, status, { jsonrpc: "2.0", error: { code, message }, id: null });

async function handleMcp(req: IncomingMessage & { auth?: AuthInfo }, res: ServerResponse) {
    if (req.method === "GET" && !req.headers["mcp-session-id"]) {
        sendJson(res, 200, { status: "ok" });
        return;
    }

    let auth: AuthInfo;
    try {
        auth = await verifyBearerToken(req.headers["authorization"], bearerOptions);
    } catch (error) {
        await sendWebResponse(res, bearerAuthChallengeResponse(error, bearerOptions));
        return;
    }
    req.auth = auth;
    const userId = userIdOf(auth);

    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    const session = sessionId ? sessions.get(sessionId) : undefined;

    // Sessão de outro usuário (ex.: logout e login com outra conta) é tratada como
    // inexistente, o que faz o cliente reinicializar com o usuário novo.
    if (session && session.userId === userId) {
        await session.transport.handleRequest(req, res);
        return;
    }

    if (!sessionId && req.method === "POST") {
        const parsed: unknown = JSON.parse(await readBody(req));

        if (isInitializeRequest(parsed)) {
            const transport = new NodeStreamableHTTPServerTransport({
                sessionIdGenerator: () => randomUUID(),
                onsessioninitialized: (id) => {
                    sessions.set(id, { transport, userId });
                },
            });
            transport.onclose = () => {
                if (transport.sessionId) sessions.delete(transport.sessionId);
            };

            const server = buildServer(userId);
            await server.connect(transport);
            await transport.handleRequest(req, res, parsed);
            return;
        }
    }

    if (sessionId) {
        jsonRpcError(res, 404, -32001, "Session not found");
        return;
    }

    jsonRpcError(res, 400, -32000, "Bad Request: Session ID required");
}

const httpServer = createServer(async (req, res) => {
    try {
        const url = new URL(req.url ?? "/", "http://localhost");

        if (await handleOAuthRoute(req, res, url)) return;

        if (url.pathname !== MCP_PATH) {
            res.writeHead(404);
            res.end();
            return;
        }

        await handleMcp(req, res);
    } catch (error) {
        console.error("Request failed", error);
        if (!res.headersSent) sendJson(res, 500, { error: "Internal Server Error" });
        else res.end();
    }
});

httpServer.listen(PORT, () => {
    console.log(`Plato MCP server listening on port ${PORT}`);
});
