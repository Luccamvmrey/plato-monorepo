import { NextFunction, Request, Response } from "express";
import { isShareToken } from "@plato/shared";
import * as shareService from "./share.service";
import { AppError } from "../../shared/error/AppError";
import { extractId, getUserId } from "../../shared/utils/request";

/** Barra o token malformado antes de ele virar consulta no banco. */
const requireShareToken = (req: Request, _res: Response, next: NextFunction) => {
    if (!isShareToken(req.params.token)) {
        throw new AppError("This link is not available", 404);
    }

    next();
};

const create = async (req: Request, res: Response) => {
    const link = await shareService.create(getUserId(req), req.body);

    res.status(201).json(link);
};

const getOwnLinks = async (req: Request, res: Response) => {
    const links = await shareService.getOwnLinks(getUserId(req));

    res.json(links);
};

const revoke = async (req: Request, res: Response) => {
    await shareService.revoke(getUserId(req), extractId(req));

    res.status(204).send();
};

const getPublic = async (req: Request, res: Response) => {
    const plan = await shareService.getPublic(req.params.token as string);

    res.json(plan);
};

const getFeatured = async (_req: Request, res: Response) => {
    const plans = await shareService.getFeatured();

    res.json(plans);
};

const addToLibrary = async (req: Request, res: Response) => {
    const result = await shareService.addToLibrary(getUserId(req), req.params.token as string);

    res.status(result.alreadyAdded ? 200 : 201).json(result);
};

export { requireShareToken, create, getOwnLinks, revoke, getPublic, getFeatured, addToLibrary };
