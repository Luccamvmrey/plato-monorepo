import type { OAuthMetadata } from "@modelcontextprotocol/server";
import { buildOAuthProtectedResourceMetadata, getOAuthProtectedResourceMetadataUrl } from "@modelcontextprotocol/server";

export const PORT = parseInt(process.env.PORT ?? "3001", 10);

// Origem pública do servidor (atrás de proxy, é a URL que o Claude enxerga). Só a origem é usada.
const ORIGIN = new URL(process.env.MCP_PUBLIC_URL ?? `http://localhost:${PORT}`).origin;

export const MCP_PATH = "/mcp";
export const RESOURCE_URL = new URL(MCP_PATH, ORIGIN);
export const RESOURCE_METADATA_URL = getOAuthProtectedResourceMetadataUrl(RESOURCE_URL);

export const SCOPE = "mcp";

export const ACCESS_TOKEN_TTL_S = 60 * 60;
export const REFRESH_TOKEN_TTL_S = 30 * 24 * 60 * 60;
export const AUTHORIZATION_CODE_TTL_S = 10 * 60;

export const OAUTH_PATHS = {
    authorize: "/oauth/authorize",
    token: "/oauth/token",
    register: "/oauth/register",
    revoke: "/oauth/revoke",
} as const;

export const AUTHORIZATION_SERVER_METADATA: OAuthMetadata = {
    issuer: ORIGIN,
    authorization_endpoint: `${ORIGIN}${OAUTH_PATHS.authorize}`,
    token_endpoint: `${ORIGIN}${OAUTH_PATHS.token}`,
    registration_endpoint: `${ORIGIN}${OAUTH_PATHS.register}`,
    revocation_endpoint: `${ORIGIN}${OAUTH_PATHS.revoke}`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    revocation_endpoint_auth_methods_supported: ["none"],
    scopes_supported: [SCOPE],
};

export const PROTECTED_RESOURCE_METADATA = buildOAuthProtectedResourceMetadata({
    oauthMetadata: AUTHORIZATION_SERVER_METADATA,
    resourceServerUrl: RESOURCE_URL,
    scopesSupported: [SCOPE],
    resourceName: "Plato",
    // Só para desenvolvimento local; em produção MCP_PUBLIC_URL é https.
    dangerouslyAllowInsecureIssuerUrl: ORIGIN.startsWith("http://"),
});
