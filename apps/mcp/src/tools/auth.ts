import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { revokeAllSessions, revokeToken } from "../oauth/store.js";

export function registerAuthTools(server: McpServer, requireAuth: () => number) {
    server.registerTool(
        "logout",
        {
            title: "Logout",
            description:
                "Sign out of the Plato app by revoking the current OAuth session. After this, every tool call fails until the user reconnects (re-authenticates) the connector.",
            inputSchema: z.object({
                all_devices: z
                    .boolean()
                    .optional()
                    .describe("Also revoke every other OAuth session of this user (other clients/devices). Default false."),
            }),
        },
        async ({ all_devices }, ctx) => {
            const userId = requireAuth();
            const token = ctx.http?.authInfo?.token;

            if (!token) {
                return {
                    content: [{ type: "text" as const, text: "No OAuth session on this connection." }],
                    isError: true,
                };
            }

            const revoked = all_devices ? await revokeAllSessions(userId) : await revokeToken(token);

            return {
                content: [
                    {
                        type: "text" as const,
                        text: `Logged out (${revoked} session${revoked === 1 ? "" : "s"} revoked). Reconnect the Plato connector to sign in again.`,
                    },
                ],
            };
        }
    );
}
