import type { IncomingMessage, ServerResponse } from "node:http";
import { OAuthError, OAuthErrorCode } from "@modelcontextprotocol/server";
import bcrypt from "bcrypt";
import { prisma } from "@plato/database";
import { readBody, readParams, redirect, sendHtml, sendJson } from "../http.js";
import { AUTHORIZATION_SERVER_METADATA, OAUTH_PATHS, PROTECTED_RESOURCE_METADATA, RESOURCE_URL } from "./config.js";
import { renderErrorPage, renderLoginPage } from "./login-page.js";
import {
    createAuthorizationCode,
    exchangeAuthorizationCode,
    findClient,
    refreshSession,
    registerClient,
    revokeToken,
} from "./store.js";

// Endpoints chamados por clientes que podem rodar no browser (ex.: MCP Inspector).
const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, MCP-Protocol-Version",
};

const NO_STORE = { "Cache-Control": "no-store", Pragma: "no-cache" };

const AUTHORIZE_PARAMS = [
    "client_id",
    "redirect_uri",
    "response_type",
    "code_challenge",
    "code_challenge_method",
    "state",
    "scope",
    "resource",
] as const;

const FORBIDDEN_REDIRECT_SCHEMES = new Set(["javascript:", "data:", "file:", "vbscript:"]);

function isAllowedRedirectUri(value: unknown): value is string {
    if (typeof value !== "string") return false;
    try {
        const url = new URL(value);
        if (url.hash) return false;
        if (url.protocol === "https:") return true;
        if (url.protocol === "http:") return ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
        return !FORBIDDEN_REDIRECT_SCHEMES.has(url.protocol);
    } catch {
        return false;
    }
}

function sendOAuthError(res: ServerResponse, error: unknown) {
    if (error instanceof OAuthError) {
        const status = error.code === OAuthErrorCode.InvalidClient ? 401 : 400;
        sendJson(res, status, { error: error.code, error_description: error.message }, { ...CORS_HEADERS, ...NO_STORE });
        return;
    }
    console.error("OAuth endpoint failed", error);
    sendJson(res, 500, { error: "server_error" }, { ...CORS_HEADERS, ...NO_STORE });
}

/** Cliente público manda `client_id` no corpo; alguns mandam via Basic com secret vazio. */
function clientIdFrom(req: IncomingMessage, params: URLSearchParams): string {
    const fromBody = params.get("client_id");
    if (fromBody) return fromBody;

    const header = req.headers["authorization"];
    if (header?.startsWith("Basic ")) {
        const decoded = Buffer.from(header.slice(6), "base64").toString();
        const clientId = decodeURIComponent(decoded.split(":")[0] ?? "");
        if (clientId) return clientId;
    }

    throw new OAuthError(OAuthErrorCode.InvalidClient, "client_id is required");
}

async function handleRegister(req: IncomingMessage, res: ServerResponse) {
    let metadata: Record<string, unknown>;
    try {
        const parsed: unknown = JSON.parse(await readBody(req));
        if (typeof parsed !== "object" || parsed === null) throw new Error();
        metadata = parsed as Record<string, unknown>;
    } catch {
        sendJson(res, 400, { error: "invalid_client_metadata", error_description: "Body must be a JSON object" }, CORS_HEADERS);
        return;
    }

    const redirectUris = metadata.redirect_uris;
    if (!Array.isArray(redirectUris) || redirectUris.length === 0 || !redirectUris.every(isAllowedRedirectUri)) {
        sendJson(res, 400, { error: "invalid_redirect_uri", error_description: "redirect_uris must be valid https or loopback URLs" }, CORS_HEADERS);
        return;
    }

    const name = typeof metadata.client_name === "string" ? metadata.client_name.slice(0, 200) : undefined;
    const client = await registerClient(name, redirectUris);

    sendJson(
        res,
        201,
        {
            client_id: client.id,
            client_id_issued_at: Math.floor(client.createdAt.getTime() / 1000),
            client_name: client.name ?? undefined,
            redirect_uris: client.redirectUris,
            grant_types: ["authorization_code", "refresh_token"],
            response_types: ["code"],
            token_endpoint_auth_method: "none",
        },
        { ...CORS_HEADERS, ...NO_STORE }
    );
}

type AuthorizeRequest =
    | { kind: "valid"; client: { id: string; name: string | null }; redirectUri: string; codeChallenge: string; params: URLSearchParams }
    | { kind: "render-error"; message: string }
    | { kind: "redirect-error"; location: string };

async function parseAuthorizeRequest(source: URLSearchParams): Promise<AuthorizeRequest> {
    const params = new URLSearchParams();
    for (const name of AUTHORIZE_PARAMS) {
        const value = source.get(name);
        if (value !== null) params.set(name, value);
    }

    const clientId = params.get("client_id");
    const client = clientId ? await findClient(clientId) : null;
    if (!client) return { kind: "render-error", message: "Aplicativo desconhecido. Reconecte o conector e tente de novo." };

    // Sem redirect_uri confiável, o erro não pode voltar ao cliente: mostra na tela.
    const requestedRedirect = params.get("redirect_uri");
    const redirectUri = requestedRedirect ?? (client.redirectUris.length === 1 ? client.redirectUris[0] : null);
    if (!redirectUri || !client.redirectUris.includes(redirectUri)) {
        return { kind: "render-error", message: "Endereço de retorno não registrado para este aplicativo." };
    }

    const redirectError = (error: string, description: string) => {
        const location = new URL(redirectUri);
        location.searchParams.set("error", error);
        location.searchParams.set("error_description", description);
        const state = params.get("state");
        if (state) location.searchParams.set("state", state);
        return { kind: "redirect-error" as const, location: location.href };
    };

    if (params.get("response_type") !== "code") {
        return redirectError("unsupported_response_type", "Only response_type=code is supported");
    }

    const codeChallenge = params.get("code_challenge");
    if (!codeChallenge || params.get("code_challenge_method") !== "S256") {
        return redirectError("invalid_request", "PKCE with code_challenge_method=S256 is required");
    }

    const resource = params.get("resource");
    if (resource && resource.replace(/\/$/, "") !== RESOURCE_URL.href) {
        return redirectError("invalid_target", "Unknown resource");
    }

    return { kind: "valid", client, redirectUri, codeChallenge, params };
}

async function handleAuthorize(req: IncomingMessage, res: ServerResponse, url: URL) {
    const isSubmit = req.method === "POST";
    const source = isSubmit ? await readParams(req) : url.searchParams;
    const request = await parseAuthorizeRequest(source);

    if (request.kind === "render-error") {
        sendHtml(res, 400, renderErrorPage(request.message));
        return;
    }
    if (request.kind === "redirect-error") {
        redirect(res, request.location);
        return;
    }

    const loginPage = (status: number, email?: string, error?: string) =>
        sendHtml(res, status, renderLoginPage({ clientName: request.client.name, hiddenParams: request.params, email, error }));

    if (!isSubmit) {
        loginPage(200);
        return;
    }

    const email = source.get("email")?.trim() ?? "";
    const password = source.get("password") ?? "";
    const user = email ? await prisma.user.findUnique({ where: { email } }) : null;

    if (!user || !(await bcrypt.compare(password, user.password))) {
        loginPage(401, email, "Email ou senha incorretos.");
        return;
    }

    const code = await createAuthorizationCode({
        clientId: request.client.id,
        userId: user.id,
        redirectUri: request.redirectUri,
        codeChallenge: request.codeChallenge,
    });

    const location = new URL(request.redirectUri);
    location.searchParams.set("code", code);
    const state = request.params.get("state");
    if (state) location.searchParams.set("state", state);
    redirect(res, location.href);
}

async function handleToken(req: IncomingMessage, res: ServerResponse) {
    try {
        const params = await readParams(req);
        const clientId = clientIdFrom(req, params);
        const grantType = params.get("grant_type");

        let tokens;
        if (grantType === "authorization_code") {
            const code = params.get("code");
            const codeVerifier = params.get("code_verifier");
            if (!code || !codeVerifier) throw new OAuthError(OAuthErrorCode.InvalidRequest, "code and code_verifier are required");
            tokens = await exchangeAuthorizationCode({
                code,
                codeVerifier,
                clientId,
                redirectUri: params.get("redirect_uri") ?? undefined,
            });
        } else if (grantType === "refresh_token") {
            const refreshToken = params.get("refresh_token");
            if (!refreshToken) throw new OAuthError(OAuthErrorCode.InvalidRequest, "refresh_token is required");
            tokens = await refreshSession(refreshToken, clientId);
        } else {
            throw new OAuthError(OAuthErrorCode.UnsupportedGrantType, "Unsupported grant_type");
        }

        sendJson(res, 200, tokens, { ...CORS_HEADERS, ...NO_STORE });
    } catch (error) {
        sendOAuthError(res, error);
    }
}

async function handleRevoke(req: IncomingMessage, res: ServerResponse) {
    try {
        const token = (await readParams(req)).get("token");
        if (!token) throw new OAuthError(OAuthErrorCode.InvalidRequest, "token is required");
        await revokeToken(token);
        // RFC 7009: token desconhecido também responde 200.
        sendJson(res, 200, {}, { ...CORS_HEADERS, ...NO_STORE });
    } catch (error) {
        sendOAuthError(res, error);
    }
}

/** Atende as rotas OAuth/descoberta. Devolve `false` quando a rota não é dele. */
export async function handleOAuthRoute(req: IncomingMessage, res: ServerResponse, url: URL): Promise<boolean> {
    const path = url.pathname;

    if (path.startsWith("/.well-known/oauth-protected-resource")) {
        sendJson(res, 200, PROTECTED_RESOURCE_METADATA, CORS_HEADERS);
        return true;
    }
    if (path === "/.well-known/oauth-authorization-server") {
        sendJson(res, 200, AUTHORIZATION_SERVER_METADATA, CORS_HEADERS);
        return true;
    }

    const handlers: Record<string, { methods: string[]; handle: () => Promise<void> }> = {
        [OAUTH_PATHS.authorize]: { methods: ["GET", "POST"], handle: () => handleAuthorize(req, res, url) },
        [OAUTH_PATHS.token]: { methods: ["POST"], handle: () => handleToken(req, res) },
        [OAUTH_PATHS.register]: { methods: ["POST"], handle: () => handleRegister(req, res) },
        [OAUTH_PATHS.revoke]: { methods: ["POST"], handle: () => handleRevoke(req, res) },
    };

    const route = handlers[path];
    if (!route) return false;

    if (req.method === "OPTIONS") {
        res.writeHead(204, CORS_HEADERS);
        res.end();
        return true;
    }
    if (!route.methods.includes(req.method ?? "")) {
        res.writeHead(405, { Allow: route.methods.join(", ") });
        res.end();
        return true;
    }

    await route.handle();
    return true;
}
