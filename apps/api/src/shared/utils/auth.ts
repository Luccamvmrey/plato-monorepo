import { AppError } from "../error/AppError";

/**
 * Ensures that a resource belongs to a specific user.
 * @param resource The resource object (must have a userId property)
 * @param userId The ID of the user to check against
 * @param errorMessage Custom error message (optional)
 * @throws AppError 403 if ownership is not verified
 */
export const ensureOwnership = (
    resource: { userId: number } | null | undefined,
    userId: number,
    errorMessage = "You do not have permission to access this resource"
): void => {
    if (!resource) {
        throw new AppError("Resource not found", 404);
    }
    
    if (resource.userId !== userId) {
        throw new AppError(errorMessage, 403);
    }
};
