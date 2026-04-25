import { Request, Response } from "express";
import * as exerciseService from "./exercise.service";
import { extractId } from "../../shared/utils/request";

const list = async (req: Request, res: Response) => {
    const result = await exerciseService.getAll();
    res.json(result);
}

const create = async (req: Request, res: Response) => {
    const result = await exerciseService.create(req.body);
    res.status(201).json(result);
}

const update = async (req: Request, res: Response) => {
    const exerciseId = extractId(req);
    const result = await exerciseService.update(exerciseId, req.body);
    res.json(result);
}

const remove = async (req: Request, res: Response) => {
    const exerciseId = extractId(req);
    await exerciseService.remove(exerciseId);
    res.status(204).send();
}

export { list, create, update, remove };