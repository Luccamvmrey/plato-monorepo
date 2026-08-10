import { Request, Response } from "express";
import * as workoutService from "./workout.service";
import { extractId, getUserId } from "../../shared/utils/request";

const create = async (req: Request, res: Response) => {
    const userId = getUserId(req);

    const workout = await workoutService.create(userId, req.body);

    res.status(201).json(workout);
}

const getByUserId = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

    const workouts = await workoutService.getByUserId(userId, isActive);

    res.json(workouts);
}

const getById = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const workoutId = extractId(req);

    const workout = await workoutService.getById(workoutId, userId);

    res.json(workout);
}

const toggleStatus = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const workoutId = extractId(req);

    const workout = await workoutService.toggleStatus(userId, workoutId);

    res.json(workout);
}

const update = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const workoutId = extractId(req);

    const workout = await workoutService.update(userId, workoutId, req.body);

    res.json(workout);
}

const remove = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const workoutId = extractId(req);

    await workoutService.remove(userId, workoutId);

    res.status(204).send();
}

export { create, getByUserId, getById, update, remove, toggleStatus }