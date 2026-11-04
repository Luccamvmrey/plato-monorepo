import { Router } from "express";
import * as shareController from "./share.controller";
import { authenticate } from "../../shared/middleware/authMiddleware";
import { validateBody } from "../../shared/middleware/validationMiddleware";
import { addShareLimiter, createShareLimiter, shareReadLimiter } from "../../shared/middleware/rateLimitMiddleware";
import { createShareSchema } from "./share.schema";

const router = Router();

// Sem `router.use(authenticate)`: este módulo mistura rotas públicas e logadas, então a
// autenticação é declarada rota a rota.
router.get("/featured", shareReadLimiter, shareController.getFeatured);
router.get("/public/:token", shareReadLimiter, shareController.requireShareToken, shareController.getPublic);

router.post(
    "/public/:token/add",
    addShareLimiter,
    shareController.requireShareToken,
    authenticate,
    shareController.addToLibrary
);

router.post("/", createShareLimiter, authenticate, validateBody(createShareSchema), shareController.create);
router.get("/mine", authenticate, shareController.getOwnLinks);
router.delete("/:id", authenticate, shareController.revoke);

export default router;
