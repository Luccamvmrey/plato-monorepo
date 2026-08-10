import { Request, Response } from "express";
import * as bodyWeightService from "./body-weight.service";
import { extractId, getUserId } from "../../../shared/utils/request";

const list = async (req: Request, res: Response) => {
    const userId = getUserId(req);

    const logs = await bodyWeightService.list(userId);

    res.json(logs);
}

const create = async (req: Request, res: Response) => {
    const userId = getUserId(req);

    const log = await bodyWeightService.create(userId, req.body);

    res.status(201).json(log);
}

const remove = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const id = extractId(req);

    await bodyWeightService.remove(userId, id);

    res.status(204).send();
}

export { list, create, remove };
