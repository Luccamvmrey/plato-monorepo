import { Request, Response } from "express";
import * as authService from "./auth.service";
import * as userService from "../user/user.service";
import dotenv from "dotenv";
import { verify } from "jsonwebtoken";
import { AppJwtPayload } from "../../shared/jwt/types";
import { getUserId } from "../../shared/utils/request";

dotenv.config();

const register = async (req: Request, res: Response) => {
    const user = await authService.register(req.body);
    res.status(201).json(user);
}

const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const token = await authService.login(email, password);

    const payload = verify(token, process.env.JWT_SECRET) as AppJwtPayload;
    const user = await userService.getById(payload.id);

    res.json({ token, user });
}

const refresh = async (req: Request, res: Response) => {
    const token = await authService.refresh(getUserId(req));
    res.json({ token });
}

// Sempre 204: a resposta não pode revelar se o e-mail tem conta no Plato.
const forgotPassword = async (req: Request, res: Response) => {
    await authService.requestPasswordReset(req.body.email);
    res.status(204).send();
}

const resetPassword = async (req: Request, res: Response) => {
    await authService.resetPassword(req.body.token, req.body.password);
    res.status(204).send();
}

export { register, login, refresh, forgotPassword, resetPassword }

