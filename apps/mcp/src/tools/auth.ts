import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import bcrypt from "bcrypt";
import { prisma } from "@plato/database";

export function registerAuthTools(server: McpServer, setUserId: (id: number) => void) {
    server.registerTool(
        "login",
        {
            title: "Login",
            description: "Authenticate with the Plato app. Required before any other tool.",
            inputSchema: z.object({
                email: z.string().describe("User email"),
                password: z.string().describe("User password"),
            }),
        },
        async ({ email, password }) => {
            const user = await prisma.user.findUnique({ where: { email } });

            if (!user || !(await bcrypt.compare(password, user.password))) {
                return {
                    content: [{ type: "text" as const, text: "Invalid credentials." }],
                    isError: true,
                };
            }

            setUserId(user.id);

            return {
                content: [{ type: "text" as const, text: `Logged in as ${user.name} (id: ${user.id}).` }],
            };
        }
    );
}
