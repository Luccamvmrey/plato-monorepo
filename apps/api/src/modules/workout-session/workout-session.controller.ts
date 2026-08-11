import { Request, Response } from "express";
import * as workoutSessionService from "./workout-session.service";
import { extractId, getUserId } from "../../shared/utils/request";

const create = async (req: Request, res: Response) => {
    const userId = getUserId(req);

    const result = await workoutSessionService.create(userId, req.body);

    res.status(201).json(result);
}

const listByUserId = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const { workoutId, startDate, endDate } = req.query;

    const filters = {
        workoutId: workoutId ? Number(workoutId) : undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
    };

    const result = await workoutSessionService.listByUserId(userId, filters);

    res.json(result);
}

const listByWorkoutId = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const workoutId = extractId(req);

    const result = await workoutSessionService.listByWorkoutId(userId, workoutId);

    res.json(result);
}

const listById = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const workoutSessionId = extractId(req);

    const result = await workoutSessionService.listById(userId, workoutSessionId);

    res.json(result);
}

const findActiveSession = async (req: Request, res: Response) => {
    const userId = getUserId(req);

    const result = await workoutSessionService.findActiveSession(userId);

    res.json(result);
}

const finishSession = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const workoutSessionId = extractId(req);

    const result = await workoutSessionService.finishSession(userId, workoutSessionId, req.body);

    res.json(result);
}

const listByExerciseId = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const exerciseId = extractId(req);
    const result = await workoutSessionService.listByExerciseId(userId, exerciseId);
    res.json(result);
}

const HISTORY_LIMIT_DEFAULT = 4;
const HISTORY_LIMIT_MIN = 1;
const HISTORY_LIMIT_MAX = 10;

// Não há helper de validação de query no projeto — os filtros de listByUserId
// também são parseados à mão aqui.
const parseHistoryLimit = (raw: unknown) => {
    const parsed = Number(raw);

    return Number.isFinite(parsed)
        ? Math.min(HISTORY_LIMIT_MAX, Math.max(HISTORY_LIMIT_MIN, Math.trunc(parsed)))
        : HISTORY_LIMIT_DEFAULT;
}

const getExerciseHistory = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const workoutId = extractId(req);

    const result = await workoutSessionService.getExerciseHistoryByWorkout(
        userId,
        workoutId,
        parseHistoryLimit(req.query.limit)
    );

    res.json(result);
}

/**
 * Mesma forma de resposta do endpoint por treino, mas resolvida a partir da SESSÃO —
 * é o que permite devolver histórico global para o exercício que entrou fora do plano.
 */
const getSessionExerciseHistory = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const workoutSessionId = extractId(req);

    const result = await workoutSessionService.getExerciseHistoryForSession(
        userId,
        workoutSessionId,
        parseHistoryLimit(req.query.limit)
    );

    res.json(result);
}

const deleteSession = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const workoutSessionId = extractId(req);

    await workoutSessionService.deleteSession(userId, workoutSessionId);

    res.status(204).send();
}

export { create, listByUserId, listByWorkoutId, listById, findActiveSession, finishSession, listByExerciseId, getExerciseHistory, getSessionExerciseHistory, deleteSession };