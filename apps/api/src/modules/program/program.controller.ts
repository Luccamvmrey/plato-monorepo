import { Request, Response } from "express";
import * as programService from "./program.service";
import { extractId, getUserId } from "../../shared/utils/request";

const create = async (req: Request, res: Response) => {
    const userId = getUserId(req);

    const program = await programService.create(userId, req.body);

    res.status(201).json(program);
};

const getByUserId = async (req: Request, res: Response) => {
    const userId = getUserId(req);

    const programs = await programService.getByUserId(userId);

    res.json(programs);
};

const getById = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const programId = extractId(req);

    const program = await programService.getById(userId, programId);

    res.json(program);
};

const update = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const programId = extractId(req);

    const program = await programService.update(userId, programId, req.body);

    res.json(program);
};

const activate = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const programId = extractId(req);

    const program = await programService.activate(userId, programId);

    res.json(program);
};

const deactivate = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const programId = extractId(req);

    const program = await programService.deactivate(userId, programId);

    res.json(program);
};

const remove = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const programId = extractId(req);

    await programService.remove(userId, programId);

    res.status(204).send();
};

/** Sugestão de próximo treino. 204 quando não há programa ativo — não é erro. */
const getActiveNext = async (req: Request, res: Response) => {
    const userId = getUserId(req);

    const result = await programService.getActiveWithNext(userId);

    if (!result) {
        res.status(204).send();
        return;
    }

    res.json(result);
};

export { create, getByUserId, getById, update, activate, deactivate, remove, getActiveNext };
