import { NextFunction, Request, Response } from "express";
import { ZodObject } from "zod";

export const validateBody = (schema: ZodObject<any, any>) =>
    async (req: Request, _res: Response, next: NextFunction) => {
        try {
            req.body = await schema.parseAsync(req.body);
            next();
        } catch (error) {
            // Não logar req.body aqui: no /auth/login e /auth/register ele carrega a
            // senha em texto puro, e este é justamente o caminho de erro.
            next(error);
        }
    }