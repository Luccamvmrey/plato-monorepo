import { Request, Response } from "express";
import * as authService from "./auth.service";
import * as userService from "../user/user.service";
import dotenv from "dotenv";
import { verify } from "jsonwebtoken";
import { AppJwtPayload } from "../../shared/jwt/types";

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

export { register, login }

