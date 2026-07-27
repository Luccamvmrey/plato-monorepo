import { Router } from "express";
import * as exerciseController from "./exercise.controller";
import { authenticate } from "../../shared/middleware/authMiddleware";
import { validateBody } from "../../shared/middleware/validationMiddleware";
import { createExerciseSchema, bulkCreateExerciseSchema } from "./exercise.schema";

const router = Router();

router.get("/", exerciseController.list);
router.post("/", authenticate, validateBody(createExerciseSchema), exerciseController.create);
router.post("/bulk", authenticate, validateBody(bulkCreateExerciseSchema), exerciseController.bulkCreate);
router.put("/:id", authenticate, exerciseController.update);
router.delete("/:id", authenticate, exerciseController.remove);

export default router;