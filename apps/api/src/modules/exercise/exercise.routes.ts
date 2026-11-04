import { Router } from "express";
import * as exerciseController from "./exercise.controller";
import { authenticate, requireAdmin } from "../../shared/middleware/authMiddleware";
import { validateBody } from "../../shared/middleware/validationMiddleware";
import { createExerciseSchema, bulkCreateExerciseSchema, updateExerciseSchema } from "./exercise.schema";

const router = Router();

router.get("/", exerciseController.list);
// Autenticada, ao contrário do catálogo: o desempate usa o histórico do usuário.
router.get("/:id/alternatives", authenticate, exerciseController.alternatives);
// O catálogo é global: uma escrita aqui muda o app de todos os usuários.
router.post("/", authenticate, requireAdmin, validateBody(createExerciseSchema), exerciseController.create);
router.post("/bulk", authenticate, requireAdmin, validateBody(bulkCreateExerciseSchema), exerciseController.bulkCreate);
router.put("/:id", authenticate, requireAdmin, validateBody(updateExerciseSchema), exerciseController.update);
router.delete("/:id", authenticate, requireAdmin, exerciseController.remove);

export default router;