import { Router } from "express";
import { authenticate } from "../../shared/middleware/authMiddleware";
import * as personalRecordController from "./personal-record.controller";

const router = Router();

router.use(authenticate);

router.get("/", personalRecordController.getAll);
router.get("/exercise/:id", personalRecordController.getByExerciseId);

export default router;
