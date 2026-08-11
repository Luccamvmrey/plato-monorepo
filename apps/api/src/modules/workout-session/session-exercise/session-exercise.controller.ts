import { Request, Response } from "express";
import * as sessionExerciseService from "./session-exercise.service";
import { extractId, getUserId } from "../../../shared/utils/request";

const list = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const sessionId = extractId(req);

    const result = await sessionExerciseService.list(userId, sessionId);

    res.json(result);
};

const add = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const sessionId = extractId(req);

    const result = await sessionExerciseService.add(userId, sessionId, req.body);

    res.status(201).json(result);
};

const substitute = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const sessionId = extractId(req);
    const sessionExerciseId = extractId(req, "sessionExerciseId");

    const result = await sessionExerciseService.substitute(userId, sessionId, sessionExerciseId, req.body);

    res.status(201).json(result);
};

const setSkipped = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const sessionId = extractId(req);
    const sessionExerciseId = extractId(req, "sessionExerciseId");

    const result = await sessionExerciseService.setSkipped(userId, sessionId, sessionExerciseId, req.body);

    res.json(result);
};

const remove = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const sessionId = extractId(req);
    const sessionExerciseId = extractId(req, "sessionExerciseId");

    await sessionExerciseService.remove(userId, sessionId, sessionExerciseId);

    res.status(204).send();
};

export { list, add, substitute, setSkipped, remove };
