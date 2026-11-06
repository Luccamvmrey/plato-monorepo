import { Router } from "express";
import * as adminController from "./admin.controller";
import { authenticate, requireAdmin } from "../../shared/middleware/authMiddleware";

const router = Router();

router.use(authenticate, requireAdmin);

router.get("/metrics", adminController.getMetrics);

export default router;
