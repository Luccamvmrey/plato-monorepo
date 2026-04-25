import { NextFunction, Request, Response } from "express";
import { AppError } from "../error/AppError";
import { ZodError } from "zod";
import { isPrismaError } from "../error/PrismaError";

export const globalErrorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
) => {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            status: "error",
            message: err.message,
        });
    }

    if (err instanceof ZodError) {
        return res.status(400).json({
            status: "fail",
            message: "Validation failed",
            errors: err.issues.map(e => ({
                field: e.path.join('.'),
                message: e.message
            }))
        });
    }

    if (isPrismaError(err)) {
        if (err.code === "P2002") {
            const target = (err.meta?.target as string[]) || ["field"];
            return res.status(409).json({
                status: "fail",
                message: `Unique constraint violation on: ${target.join(", ")}`
            });
        }

        if (err.code === "P2025") {
            return res.status(404).json({
                status: "fail",
                message: "Record not found"
            });
        }

        if (err.code === "P2003") {
            return res.status(400).json({
                status: "fail",
                message: "Foreign key constraint failed. Check related IDs."
            });
        }
    }

    console.error("Unexpected Error:", err);
    return res.status(500).json({
        status: "error",
        message: "Internal Server Error",
    });
};