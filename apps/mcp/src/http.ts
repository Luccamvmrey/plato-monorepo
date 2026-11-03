import type { IncomingMessage, ServerResponse } from "node:http";

const MAX_BODY_BYTES = 1024 * 1024;

export async function readBody(req: IncomingMessage): Promise<string> {
    let body = "";
    for await (const chunk of req) {
        body += chunk;
        if (body.length > MAX_BODY_BYTES) throw new Error("Request body too large");
    }
    return body;
}

/** Lê corpo `application/x-www-form-urlencoded` ou JSON como pares chave → string. */
export async function readParams(req: IncomingMessage): Promise<URLSearchParams> {
    const body = await readBody(req);

    if (req.headers["content-type"]?.includes("application/json")) {
        const parsed: unknown = JSON.parse(body || "{}");
        const params = new URLSearchParams();
        if (typeof parsed === "object" && parsed !== null) {
            for (const [key, value] of Object.entries(parsed)) {
                if (typeof value === "string") params.set(key, value);
            }
        }
        return params;
    }

    return new URLSearchParams(body);
}

export function sendJson(res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}) {
    res.writeHead(status, { "Content-Type": "application/json", ...headers });
    res.end(JSON.stringify(body));
}

export function sendHtml(res: ServerResponse, status: number, html: string) {
    res.writeHead(status, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'",
        "X-Frame-Options": "DENY",
    });
    res.end(html);
}

export function redirect(res: ServerResponse, location: string) {
    res.writeHead(302, { Location: location, "Cache-Control": "no-store" });
    res.end();
}

export async function sendWebResponse(res: ServerResponse, response: Response) {
    res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
    res.end(await response.text());
}
