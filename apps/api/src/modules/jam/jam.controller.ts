import { Request, Response } from "express";
import * as jamService from "./jam.service";
import { loadJamState } from "./jam.state";
import { sendJamState, subscribeJam } from "./jam.events";
import { extractId, getUserId } from "../../shared/utils/request";

const create = async (req: Request, res: Response) => {
    res.status(201).json(await jamService.create(getUserId(req), req.body.workoutId));
};

const getPreview = async (req: Request, res: Response) => {
    res.json(await jamService.getPreview(req.params.token as string));
};

const getCandidates = async (req: Request, res: Response) => {
    res.json(await jamService.getCandidates(getUserId(req), req.params.token as string));
};

const join = async (req: Request, res: Response) => {
    res.json(await jamService.join(getUserId(req), req.params.token as string, req.body));
};

const getState = async (req: Request, res: Response) => {
    res.json(await jamService.getState(getUserId(req), extractId(req)));
};

/**
 * Server-Sent Events: o estado inteiro a cada mudança. O cliente lê com `fetch`, que manda o
 * JWT no cabeçalho; `EventSource` não manda, e token na URL ficaria nos logs do proxy.
 */
const stream = async (req: Request, res: Response) => {
    const jamId = extractId(req);

    await jamService.findMembership(getUserId(req), jamId);

    res.status(200).set({
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        // Sem isto o Nginx segura os eventos no buffer até juntar o bastante.
        "X-Accel-Buffering": "no",
    });
    res.flushHeaders();

    const unsubscribe = subscribeJam(jamId, res);
    req.on("close", unsubscribe);

    const state = await loadJamState(jamId);
    if (state) sendJamState(res, state);
};

const updatePresence = async (req: Request, res: Response) => {
    await jamService.updatePresence(getUserId(req), extractId(req), req.body);
    res.status(204).send();
};

const setExerciseMode = async (req: Request, res: Response) => {
    await jamService.setExerciseMode(getUserId(req), extractId(req), extractId(req, "exerciseId"), req.body);
    res.status(204).send();
};

const leave = async (req: Request, res: Response) => {
    await jamService.leave(getUserId(req), extractId(req));
    res.status(204).send();
};

const end = async (req: Request, res: Response) => {
    await jamService.end(getUserId(req), extractId(req));
    res.status(204).send();
};

export { create, getPreview, getCandidates, join, getState, stream, updatePresence, setExerciseMode, leave, end };
