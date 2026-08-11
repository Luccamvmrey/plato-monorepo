import { Router } from "express";
import * as exerciseController from "./exercise.controller";
import { authenticate } from "../../shared/middleware/authMiddleware";
import { validateBody } from "../../shared/middleware/validationMiddleware";
import { createExerciseSchema, bulkCreateExerciseSchema, updateExerciseSchema } from "./exercise.schema";

const router = Router();

router.get("/", exerciseController.list);
// Autenticada, ao contrário do catálogo: o desempate usa o histórico do usuário.
router.get("/:id/alternatives", authenticate, exerciseController.alternatives);
router.post("/", authenticate, validateBody(createExerciseSchema), exerciseController.create);
router.post("/bulk", authenticate, validateBody(bulkCreateExerciseSchema), exerciseController.bulkCreate);
router.put("/:id", authenticate, validateBody(updateExerciseSchema), exerciseController.update);
router.delete("/:id", authenticate, exerciseController.remove);

export default router;