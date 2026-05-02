import { Router } from "express";
import { authenticate } from "../../shared/middleware/authMiddleware";
import * as workoutSessionController from "./workout-session.controller";
import * as sessionSetController from "./session-set/session-set.controller"
import { validateBody } from "../../shared/middleware/validationMiddleware";
import { createWorkoutSessionSchema, finishSessionSchema } from "./workout-session.schema";
import { createSessionSetSchema, updateSessionSetSchema } from "./session-set/session-set.schema";

const router = Router();

router.use(authenticate);

// --- Workout Session Routes ---
router.get("/", workoutSessionController.listByUserId);
router.get("/active", workoutSessionController.findActiveSession);
router.get("/workout/:id", workoutSessionController.listByWorkoutId);
router.get("/:id", workoutSessionController.listById);
router.post("/", validateBody(createWorkoutSessionSchema), workoutSessionController.create);
router.post("/:id/finish", validateBody(finishSessionSchema), workoutSessionController.finishSession);
router.delete("/:id", workoutSessionController.deleteSession);

// --- Session Set Routes ---
router.post("/sets", validateBody(createSessionSetSchema), sessionSetController.create);
router.put("/sets/:id", validateBody(updateSessionSetSchema), sessionSetController.update);

export default router;