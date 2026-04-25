import * as sessionSetService from "./session-set.service";
import { Request, Response } from "express";
import { extractId, getUserId } from "../../../shared/utils/request";

const create = async (req: Request, res: Response) => {
    const result = await sessionSetService.create(req.body);

    res.status(201).json(result);
}

const update = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const setId = extractId(req);

    const result = await sessionSetService.update(userId, setId, req.body);

    res.json(result);
}

export { create, update };