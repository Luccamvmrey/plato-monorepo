import rateLimit from "express-rate-limit";

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

const createLimiter = (windowMs: number, limit: number) => rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { status: "fail", message: "Too many attempts. Try again later." },
});

/** Login e cadastro: barra tentativa de senha em massa. */
export const authLimiter = createLimiter(FIFTEEN_MINUTES, 20);

/** Mais restrito porque cada pedido dispara um e-mail para um endereço qualquer. */
export const forgotPasswordLimiter = createLimiter(ONE_HOUR, 5);

export const resetPasswordLimiter = createLimiter(FIFTEEN_MINUTES, 10);
