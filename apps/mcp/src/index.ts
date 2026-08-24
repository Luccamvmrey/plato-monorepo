import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import { buildServer, isInitializeRequest } from "./server.js";

const PORT = parseInt(process.env.PORT ?? "3001", 10);
const MCP_SECRET = process.env.MCP_SECRET;

const sessions = new Map<string, NodeStreamableHTTPServerTransport>();

const httpServer = createServer(async (req, res) => {
    if (MCP_SECRET) {
        const auth = req.headers["authorization"];
        if (auth !== `Bearer ${MCP_SECRET}`) {
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Unauthorized" }));
            return;
        }
    }

    if (req.url !== "/mcp") {
        res.writeHead(404);
        res.end();
        return;
    }

    if (req.method === "GET" && !req.headers["mcp-session-id"]) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok" }));
        return;
    }

    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    if (sessionId && sessions.has(sessionId)) {
        await sessions.get(sessionId)!.handleRequest(req, res);
        return;
    }

    if (!sessionId && req.method === "POST") {
        let body = "";
        for await (const chunk of req) body += chunk;
        const parsed = JSON.parse(body);

        if (isInitializeRequest(parsed)) {
            const transport = new NodeStreamableHTTPServerTransport({
                sessionIdGenerator: () => randomUUID(),
                onsessioninitialized: (id) => {
                    sessions.set(id, transport);
                },
            });
            transport.onclose = () => {
                if (transport.sessionId) sessions.delete(transport.sessionId);
            };

            const server = buildServer();
            await server.connect(transport);
            await transport.handleRequest(req, res, parsed);
            return;
        }
    }

    if (sessionId) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32001, message: "Session not found" }, id: null }));
        return;
    }

    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message: "Bad Request: Session ID required" }, id: null }));
});

httpServer.listen(PORT, () => {
    console.log(`Plato MCP server listening on port ${PORT}`);
});
