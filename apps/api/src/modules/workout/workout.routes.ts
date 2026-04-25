import { Router } from "express";
import * as workoutController from "./workout.controller";
import { authenticate } from "../../shared/middleware/authMiddleware";
import { validateBody } from "../../shared/middleware/validationMiddleware";
import { createWorkoutSchema, updateWorkoutSchema } from "./workout.schema";

const router = Router();

router.use(authenticate);

router.post("/", validateBody(createWorkoutSchema), workoutController.create);
router.get("/", workoutController.getByUserId);
router.get("/:id", workoutController.getById);
router.put("/:id", validateBody(updateWorkoutSchema), workoutController.update);
router.patch("/:id/status", workoutController.toggleStatus);
router.delete("/:id", workoutController.remove);

export default router;
