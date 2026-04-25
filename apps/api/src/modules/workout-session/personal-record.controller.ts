import { Request, Response } from "express";
import prisma from "@plato/database";
import { getUserId } from "../../shared/utils/request";

export const getByExerciseId = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const exerciseId = parseInt(req.params.id);

    const records = await prisma.personalRecord.findMany({
        where: { userId, exerciseId }
    });

    res.json(records);
}

export const getAll = async (req: Request, res: Response) => {
    const userId = getUserId(req);

    const records = await prisma.personalRecord.findMany({
        where: { userId },
        include: { exercise: true }
    });

    res.json(records);
}
