import { Router } from "express";
import * as jamController from "./jam.controller";
import { authenticate, requireBeta } from "../../shared/middleware/authMiddleware";
import { validateBody } from "../../shared/middleware/validationMiddleware";
import { addShareLimiter, shareReadLimiter } from "../../shared/middleware/rateLimitMiddleware";
import { createJamSchema, jamModeSchema, jamPresenceSchema, joinJamSchema } from "./jam.schema";

const router = Router();

// Pública: a tela de entrada aparece antes do login, para quem escaneou o QR sem conta.
router.get("/preview/:token", shareReadLimiter, jamController.getPreview);

// Jam é beta: o resto exige conta e o toggle ligado. Quem chega pelo QR sem beta liga com
// um toque na tela de entrada e só então chama estas rotas.
router.use(authenticate, requireBeta);

router.post("/", validateBody(createJamSchema), jamController.create);
router.get("/:token/candidates", jamController.getCandidates);
router.post("/:token/join", addShareLimiter, validateBody(joinJamSchema), jamController.join);

router.get("/:id", jamController.getState);
router.get("/:id/stream", jamController.stream);
router.put("/:id/presence", validateBody(jamPresenceSchema), jamController.updatePresence);
router.put("/:id/modes/:exerciseId", validateBody(jamModeSchema), jamController.setExerciseMode);
router.post("/:id/leave", jamController.leave);
router.post("/:id/end", jamController.end);

export default router;
