import { NextFunction, Request, Response } from "express";
import { ZodObject } from "zod";

export const validateBody = (schema: ZodObject<any, any>) =>
    async (req: Request, _res: Response, next: NextFunction) => {
        try {
            req.body = await schema.parseAsync(req.body);
            next();
        } catch (error) {
            console.log(req.body)
            next(error);
        }
    }