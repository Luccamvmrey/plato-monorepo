import { Router } from "express";
import { authenticate } from "../../shared/middleware/authMiddleware";
import * as workoutSessionController from "./workout-session.controller";
import * as sessionSetController from "./session-set/session-set.controller"
import * as sessionExerciseController from "./session-exercise/session-exercise.controller"
import { validateBody } from "../../shared/middleware/validationMiddleware";
import { createWorkoutSessionSchema, finishSessionSchema } from "./workout-session.schema";
import { createSessionSetSchema, updateSessionSetSchema } from "./session-set/session-set.schema";
import {
    addSessionExerciseSchema,
    skipSessionExerciseSchema,
    substituteSessionExerciseSchema,
} from "./session-exercise/session-exercise.schema";

const router = Router();

router.use(authenticate);

// --- Workout Session Routes ---
router.get("/", workoutSessionController.listByUserId);
router.get("/active", workoutSessionController.findActiveSession);
router.get("/workout/:id/exercise-history", workoutSessionController.getExerciseHistory);
router.get("/workout/:id", workoutSessionController.listByWorkoutId);
router.get("/exercise/:id", workoutSessionController.listByExerciseId);
router.get("/:id/exercise-history", workoutSessionController.getSessionExerciseHistory);
router.get("/:id", workoutSessionController.listById);
router.post("/", validateBody(createWorkoutSessionSchema), workoutSessionController.create);
router.post("/:id/finish", validateBody(finishSessionSchema), workoutSessionController.finishSession);
router.delete("/:id", workoutSessionController.deleteSession);

// --- Session Set Routes ---
router.post("/sets", validateBody(createSessionSetSchema), sessionSetController.create);
router.put("/sets/:id", validateBody(updateSessionSetSchema), sessionSetController.update);

// --- Session Exercise Routes (snapshot da prescrição) ---
router.get("/:id/exercises", sessionExerciseController.list);
router.post("/:id/exercises", validateBody(addSessionExerciseSchema), sessionExerciseController.add);
router.patch(
    "/:id/exercises/:sessionExerciseId/substitute",
    validateBody(substituteSessionExerciseSchema),
    sessionExerciseController.substitute
);
router.patch(
    "/:id/exercises/:sessionExerciseId/skip",
    validateBody(skipSessionExerciseSchema),
    sessionExerciseController.setSkipped
);
router.delete("/:id/exercises/:sessionExerciseId", sessionExerciseController.remove);

export default router;
