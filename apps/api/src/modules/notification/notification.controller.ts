import { Request, Response } from "express";
import * as notificationService from "./notification.service";
import * as restAlert from "./rest-alert";
import { extractId, getUserId } from "../../shared/utils/request";

const getSettings = async (req: Request, res: Response) => {
    const timezone = typeof req.query.timezone === "string" ? req.query.timezone : undefined;

    res.json(await notificationService.getSettings(getUserId(req), timezone));
};

const updateSettings = async (req: Request, res: Response) => {
    res.json(await notificationService.updateSettings(getUserId(req), req.body));
};

const subscribe = async (req: Request, res: Response) => {
    await notificationService.subscribe(getUserId(req), req.body);

    res.status(204).send();
};

const removeDevice = async (req: Request, res: Response) => {
    await notificationService.removeDevice(getUserId(req), req.body.endpoint);

    res.status(204).send();
};

const dismissPrompt = async (req: Request, res: Response) => {
    await notificationService.dismissPrompt(getUserId(req));

    res.status(204).send();
};

const markOpened = async (req: Request, res: Response) => {
    await notificationService.markOpened(getUserId(req), extractId(req));

    res.status(204).send();
};

const sendTest = async (req: Request, res: Response) => {
    await notificationService.sendTest(getUserId(req));

    res.status(204).send();
};

const scheduleRestAlert = async (req: Request, res: Response) => {
    const { endpoint, remainingMs, measureFrom } = req.body;

    restAlert.scheduleRestAlert(getUserId(req), endpoint, remainingMs, measureFrom);

    res.status(204).send();
};

const cancelRestAlert = async (req: Request, res: Response) => {
    restAlert.cancelRestAlert(getUserId(req));

    res.status(204).send();
};

const unsubscribeEmail = async (req: Request, res: Response) => {
    await notificationService.unsubscribeEmail(req.params.token as string);

    res.status(204).send();
};

export {
    getSettings,
    updateSettings,
    subscribe,
    removeDevice,
    dismissPrompt,
    markOpened,
    sendTest,
    scheduleRestAlert,
    cancelRestAlert,
    unsubscribeEmail,
};
