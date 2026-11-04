import { NextFunction, Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import * as dotenv from "dotenv";
import prisma from "@plato/database";
import { AppJwtPayload } from "../jwt/types";

dotenv.config();

declare global {
    namespace Express {
        interface Request {
            user?: AppJwtPayload;
        }
    }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "No token provided or invalid format" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) return res.status(401).json({ error: "No token provided" });

    let payload: AppJwtPayload;

    try {
        payload = jwt.verify(token, process.env.JWT_SECRET!) as AppJwtPayload;
    } catch {
        return res.status(401).json({ error: "Invalid token" });
    }

    // Tokens antigos não têm `exp` e valeriam para sempre: são recusados e o usuário
    // entra de novo uma vez. A consulta fora do try deixa falha de banco virar 500, e
    // não um 401 que derrubaria a sessão do usuário por um problema nosso.
    if (typeof payload.exp !== "number") {
        return res.status(401).json({ error: "Invalid token" });
    }

    const user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: { tokenVersion: true },
    });

    if (!user || user.tokenVersion !== payload.tv) {
        return res.status(401).json({ error: "Invalid token" });
    }

    req.user = payload;
    next();
};

/** Usar depois de `authenticate`. Sem `ADMIN_USER_IDS` definido, ninguém é admin. */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    const adminIds = (process.env.ADMIN_USER_IDS ?? "").split(",").map((id) => id.trim());

    if (!req.user || !adminIds.includes(String(req.user.id))) {
        return res.status(403).json({ error: "Admin access required" });
    }

    next();
};