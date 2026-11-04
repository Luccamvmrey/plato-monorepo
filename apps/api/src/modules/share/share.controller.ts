import { readFile } from "fs/promises";
import * as path from "path";
import { NextFunction, Request, Response } from "express";
import { isShareToken } from "@plato/shared";
import * as shareService from "./share.service";
import { clipDescription, renderSharePage } from "./share-page";
import { AppError } from "../../shared/error/AppError";
import { getAppUrl } from "../../shared/utils/app-url";
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

const WEB_INDEX_PATH = process.env.WEB_INDEX_PATH
    ?? path.resolve(__dirname, "../../../../web/dist/index.html");

const UNAVAILABLE_META = {
    title: "Plato",
    description: "Acompanhe seus treinos e a evolução de carga.",
};

/** A página de `/s/:token`, servida pelo Nginx no lugar do `index.html` estático. */
const getPage = async (req: Request, res: Response) => {
    let html: string;

    try {
        html = await readFile(WEB_INDEX_PATH, "utf8");
    } catch (error) {
        // O `index.html` some por instantes enquanto o deploy refaz o build do web.
        console.error("Failed to read web index", error);
        res.status(503).set("Retry-After", "30").type("text/plain").send("Try again in a moment.");
        return;
    }

    const token = req.params.token as string;
    const summary = await shareService.getPageSummary(token);
    const appUrl = getAppUrl();
    const image = `${appUrl}/pwa-512x512.png`;

    // no-cache: sem ele, o Cloudflare ou o navegador manteria vivo um link já revogado.
    res.status(summary ? 200 : 404).set("Cache-Control", "no-cache").type("html");

    if (!summary) {
        res.send(renderSharePage(html, { ...UNAVAILABLE_META, image, indexable: false }));
        return;
    }

    const fallbackDescription = summary.kind === "PROGRAM"
        ? `Programa com ${summary._count.workouts} ${summary._count.workouts === 1 ? "treino" : "treinos"} para adicionar no Plato.`
        : "Treino para adicionar no Plato.";

    res.send(renderSharePage(html, {
        title: summary.name,
        description: clipDescription(summary.description ?? fallbackDescription),
        url: `${appUrl}/s/${token}`,
        image,
        indexable: summary.curatedKey !== null,
    }));
};

export { requireShareToken, create, getOwnLinks, revoke, getPublic, getFeatured, addToLibrary, getPage };
