import prisma from "@plato/database";
import { comparePassword, generateToken, hashPassword } from "./auth.utils";
import { AppError } from "../../shared/error/AppError";
import { sendEmail } from "../../shared/email/email";
import { findPlanIdForSignup } from "../share/share.service";
import { createHash, randomBytes } from "crypto";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const DEFAULT_APP_URL = "https://plato-work-out.com";

const hashResetToken = (token: string) => createHash("sha256").update(token).digest("hex");

const issueToken = (user: { id: number, email: string, tokenVersion: number }) =>
    generateToken({ id: user.id, email: user.email, tv: user.tokenVersion });

const register = async ({ email, password, name, sharedPlanToken }: {
    email: string,
    password: string,
    name: string,
    sharedPlanToken?: string,
}) => {
    const hashedPassword = await hashPassword(password);
    const signupPlanId = await findPlanIdForSignup(sharedPlanToken);

    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name,
            signupPlanId,
            // O schema só deixa o cadastro chegar aqui com os termos aceitos.
            termsAcceptedAt: new Date(),
        }
    });

    return { id: user.id, email: user.email, name: user.name };
};

const login = async (email: string, password: string) => {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await comparePassword(password, user.password))) {
        throw new AppError("Invalid credentials", 401);
    }

    return issueToken(user);
};

const refresh = async (userId: number) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

    return issueToken(user);
};

const requestPasswordReset = async (email: string) => {
    // Insensível a caixa: quem digita "Fulano@..." no celular não pode ficar sem o
    // e-mail porque a conta foi criada com "fulano@...".
    const user = await prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
    });

    if (!user) return;

    const token = randomBytes(32).toString("hex");

    // Só o link mais recente vale.
    await prisma.$transaction([
        prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
        prisma.passwordResetToken.create({
            data: {
                tokenHash: hashResetToken(token),
                userId: user.id,
                expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
            },
        }),
    ]);

    const appUrl = (process.env.APP_URL ?? DEFAULT_APP_URL).replace(/\/$/, "");
    const link = `${appUrl}/reset-password?token=${token}`;

    // Sem await: esperar o provedor faria a resposta demorar mais só quando a conta
    // existe, e esse tempo revelaria quais e-mails estão cadastrados.
    sendEmail({
        to: user.email,
        subject: "Redefina sua senha do Plato",
        text: `Recebemos um pedido para redefinir sua senha do Plato.\n\nAbra este link em até 1 hora:\n${link}\n\nSe não foi você, ignore este e-mail. Sua senha continua a mesma.`,
        html: `<p>Recebemos um pedido para redefinir sua senha do Plato.</p><p><a href="${link}">Redefinir minha senha</a></p><p>O link vale por 1 hora. Se não foi você, ignore este e-mail. Sua senha continua a mesma.</p>`,
    }).catch((err: Error) => console.error(`Password reset email failed: ${err.message}`));
};

const resetPassword = async (token: string, password: string) => {
    const hashedPassword = await hashPassword(password);
    const tokenHash = hashResetToken(token);

    await prisma.$transaction(async (tx) => {
        const resetToken = await tx.passwordResetToken.findUnique({ where: { tokenHash } });

        if (!resetToken || resetToken.expiresAt < new Date()) {
            throw new AppError("Invalid or expired token", 400);
        }

        // deleteMany conta as linhas apagadas: em dois envios simultâneos do mesmo
        // link, só um encontra a linha e segue. O link é mesmo de uso único.
        const { count } = await tx.passwordResetToken.deleteMany({ where: { tokenHash } });

        if (count !== 1) {
            throw new AppError("Invalid or expired token", 400);
        }

        // Quem roubou a senha antiga não pode continuar logado: encerra as sessões do
        // app (tokenVersion) e as do MCP (OAuthSession).
        await tx.user.update({
            where: { id: resetToken.userId },
            data: { password: hashedPassword, tokenVersion: { increment: 1 } },
        });
        await tx.oAuthSession.deleteMany({ where: { userId: resetToken.userId } });
    });
};

export { register, login, refresh, requestPasswordReset, resetPassword };