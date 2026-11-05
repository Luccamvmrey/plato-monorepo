import { Router } from "express";
import * as notificationController from "./notification.controller";
import { authenticate, requireAdmin } from "../../shared/middleware/authMiddleware";
import { testPushLimiter, unsubscribeLimiter } from "../../shared/middleware/rateLimitMiddleware";
import { validateBody } from "../../shared/middleware/validationMiddleware";
import { subscribeSchema, unsubscribeDeviceSchema, updateSettingsSchema } from "./notification.schema";

const router = Router();

// Sem `router.use(authenticate)`: o descadastro vem do e-mail, sem sessão aberta.
router.post("/unsubscribe/:token", unsubscribeLimiter, notificationController.unsubscribeEmail);

router.get("/settings", authenticate, notificationController.getSettings);
router.put("/settings", authenticate, validateBody(updateSettingsSchema), notificationController.updateSettings);
router.post("/subscriptions", authenticate, validateBody(subscribeSchema), notificationController.subscribe);
router.delete("/subscriptions", authenticate, validateBody(unsubscribeDeviceSchema), notificationController.removeDevice);
router.post("/prompt-dismissed", authenticate, notificationController.dismissPrompt);
router.post("/test", testPushLimiter, authenticate, requireAdmin, notificationController.sendTest);
router.post("/:id/opened", authenticate, notificationController.markOpened);

export default router;
