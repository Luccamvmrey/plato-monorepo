import { Request, Response } from "express";
import * as userService from "./user.service";
import { extractId } from "../../shared/utils/request";

const list = async (req: Request, res: Response) => {
    const users = await userService.getAll();
    res.json(users);
}

const getById = async (req: Request, res: Response) => {
    const userId = extractId(req);
    const user = await userService.getById(userId);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
}

const update = async (req: Request, res: Response) => {
    const userId = extractId(req);
    const user = await userService.update(userId, req.body);
    res.json(user);
}

const profile = async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const data = await userService.getProfile(userId);
    res.json(data);
}

const stats = async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const data = await userService.getStats(userId);
    res.json(data);
}

const exportData = async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const data = await userService.getExportData(userId);
    res.json(data);
}

const deleteAccount = async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    await userService.deleteAccount(userId);
    res.status(204).send();
}

const streak = async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const data = await userService.getStreak(userId);
    res.json(data);
}

export { list, getById, update, profile, stats, exportData, deleteAccount, streak }