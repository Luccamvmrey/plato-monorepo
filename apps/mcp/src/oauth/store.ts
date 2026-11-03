import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { AuthInfo, OAuthTokens, OAuthTokenVerifier } from "@modelcontextprotocol/server";
import { OAuthError, OAuthErrorCode } from "@modelcontextprotocol/server";
import { prisma } from "@plato/database";
import { ACCESS_TOKEN_TTL_S, AUTHORIZATION_CODE_TTL_S, REFRESH_TOKEN_TTL_S, SCOPE } from "./config.js";

// Tokens são opacos e só o hash vai para o banco: um dump do banco não vira acesso.
const newToken = () => randomBytes(32).toString("base64url");
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
const secondsFromNow = (seconds: number) => new Date(Date.now() + seconds * 1000);

export function userIdOf(auth: AuthInfo): number {
    const userId = auth.extra?.userId;
    if (typeof userId !== "number") throw new Error("AuthInfo without userId");
    return userId;
}

export const tokenVerifier: OAuthTokenVerifier = {
    async verifyAccessToken(token) {
        const session = await prisma.oAuthSession.findUnique({ where: { accessTokenHash: hashToken(token) } });

        if (!session || session.accessExpiresAt <= new Date()) {
            throw new OAuthError(OAuthErrorCode.InvalidToken, "Invalid or expired access token");
        }

        return {
            token,
            clientId: session.clientId,
            scopes: session.scope.split(" "),
            expiresAt: Math.floor(session.accessExpiresAt.getTime() / 1000),
            extra: { userId: session.userId },
        };
    },
};

export async function registerClient(name: string | undefined, redirectUris: string[]) {
    return prisma.oAuthClient.create({ data: { id: randomUUID(), name, redirectUris } });
}

export async function findClient(clientId: string) {
    return prisma.oAuthClient.findUnique({ where: { id: clientId } });
}

export async function createAuthorizationCode(params: {
    clientId: string;
    userId: number;
    redirectUri: string;
    codeChallenge: string;
}): Promise<string> {
    const code = newToken();

    await prisma.oAuthAuthorizationCode.create({
        data: {
            ...params,
            codeHash: hashToken(code),
            scope: SCOPE,
            expiresAt: secondsFromNow(AUTHORIZATION_CODE_TTL_S),
        },
    });

    return code;
}

function tokenPair() {
    const accessToken = newToken();
    const refreshToken = newToken();

    return {
        accessToken,
        refreshToken,
        data: {
            accessTokenHash: hashToken(accessToken),
            accessExpiresAt: secondsFromNow(ACCESS_TOKEN_TTL_S),
            refreshTokenHash: hashToken(refreshToken),
            refreshExpiresAt: secondsFromNow(REFRESH_TOKEN_TTL_S),
        },
    };
}

function tokenResponse(accessToken: string, refreshToken: string, scope: string): OAuthTokens {
    return {
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: ACCESS_TOKEN_TTL_S,
        refresh_token: refreshToken,
        scope,
    };
}

function verifyPkce(codeVerifier: string, codeChallenge: string): boolean {
    return createHash("sha256").update(codeVerifier).digest("base64url") === codeChallenge;
}

export async function exchangeAuthorizationCode(params: {
    code: string;
    clientId: string;
    redirectUri: string | undefined;
    codeVerifier: string;
}): Promise<OAuthTokens> {
    // `delete` devolve a linha e falha se ela não existe: o código é de uso único mesmo
    // com duas trocas concorrentes.
    const authorization = await prisma.oAuthAuthorizationCode
        .delete({ where: { codeHash: hashToken(params.code) } })
        .catch(() => null);

    if (
        !authorization ||
        authorization.expiresAt <= new Date() ||
        authorization.clientId !== params.clientId ||
        (params.redirectUri !== undefined && authorization.redirectUri !== params.redirectUri) ||
        !verifyPkce(params.codeVerifier, authorization.codeChallenge)
    ) {
        throw new OAuthError(OAuthErrorCode.InvalidGrant, "Invalid authorization code");
    }

    await purgeExpired();

    const { accessToken, refreshToken, data } = tokenPair();
    await prisma.oAuthSession.create({
        data: { ...data, clientId: authorization.clientId, userId: authorization.userId, scope: authorization.scope },
    });

    return tokenResponse(accessToken, refreshToken, authorization.scope);
}

export async function refreshSession(refreshToken: string, clientId: string): Promise<OAuthTokens> {
    const session = await prisma.oAuthSession.findUnique({ where: { refreshTokenHash: hashToken(refreshToken) } });

    if (!session || session.clientId !== clientId || session.refreshExpiresAt <= new Date()) {
        throw new OAuthError(OAuthErrorCode.InvalidGrant, "Invalid refresh token");
    }

    // Rotação: o refresh antigo morre aqui. O `where` com o hash antigo faz a segunda de
    // duas rotações concorrentes falhar em vez de gerar um par paralelo.
    const next = tokenPair();
    const rotated = await prisma.oAuthSession
        .update({ where: { id: session.id, refreshTokenHash: session.refreshTokenHash }, data: next.data })
        .catch(() => null);

    if (!rotated) throw new OAuthError(OAuthErrorCode.InvalidGrant, "Invalid refresh token");

    return tokenResponse(next.accessToken, next.refreshToken, session.scope);
}

/** Encerra a sessão dona do token, seja ele access ou refresh. */
export async function revokeToken(token: string): Promise<number> {
    const tokenHash = hashToken(token);
    const { count } = await prisma.oAuthSession.deleteMany({
        where: { OR: [{ accessTokenHash: tokenHash }, { refreshTokenHash: tokenHash }] },
    });
    return count;
}

export async function revokeAllSessions(userId: number): Promise<number> {
    const { count } = await prisma.oAuthSession.deleteMany({ where: { userId } });
    return count;
}

async function purgeExpired() {
    const now = new Date();
    await prisma.oAuthAuthorizationCode.deleteMany({ where: { expiresAt: { lte: now } } });
    await prisma.oAuthSession.deleteMany({ where: { refreshExpiresAt: { lte: now } } });
}
