import { Request, Response } from "express";
import * as userService from "./user.service";
import { extractId, getUserId } from "../../shared/utils/request";
import { AppError } from "../../shared/error/AppError";

/**
 * As rotas /:id existem por compatibilidade, mas o :id só pode ser o do próprio
 * usuário autenticado. Sem isso qualquer usuário lia e escrevia em qualquer conta.
 */
const ensureSelf = (req: Request): number => {
    const userId = getUserId(req);

    if (extractId(req) !== userId) {
        throw new AppError("You do not have permission to access this resource", 403);
    }

    return userId;
}

const list = async (_req: Request, res: Response) => {
    const users = await userService.getAll();
    res.json(users);
}

const getById = async (req: Request, res: Response) => {
    const userId = ensureSelf(req);
    const user = await userService.getById(userId);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
}

const update = async (req: Request, res: Response) => {
    const userId = ensureSelf(req);
    const user = await userService.update(userId, req.body);
    res.json(user);
}

const profile = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const data = await userService.getProfile(userId);
    res.json(data);
}

const stats = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const data = await userService.getStats(userId);
    res.json(data);
}

const exportData = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const data = await userService.getExportData(userId);
    res.json(data);
}

const deleteAccount = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    await userService.deleteAccount(userId);
    res.status(204).send();
}

const streak = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const tz = typeof req.query.tz === 'string' ? req.query.tz : 'UTC';
    try {
        Intl.DateTimeFormat(undefined, { timeZone: tz });
    } catch {
        return res.status(400).json({ message: 'Invalid timezone' });
    }
    const data = await userService.getStreak(userId, tz);
    res.json(data);
}

export { list, getById, update, profile, stats, exportData, deleteAccount, streak }
