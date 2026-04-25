import { Request } from "express";

/**
 * Extracts the user ID from the request object (populated by auth middleware).
 * @throws Error if req.user or req.user.id is missing.
 */
export const getUserId = (req: Request): number => {
    if (!req.user?.id) {
        throw new Error("User ID not found in request. Ensure auth middleware is applied.");
    }
    return req.user.id;
};

/**
 * Parses a numeric ID from request parameters.
 * @param req Express Request object
 * @param paramName The name of the parameter (default: 'id')
 * @returns The parsed number
 */
export const extractId = (req: Request, paramName = "id"): number => {
    const value = req.params[paramName];
    const id = parseInt(value as string, 10);
    
    if (isNaN(id)) {
        throw new Error(`Invalid ID parameter: ${paramName}=${value}`);
    }
    
    return id;
};
