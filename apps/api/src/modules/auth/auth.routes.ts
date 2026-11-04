import { Router } from "express";
import * as authController from "./auth.controller";
import { validateBody } from "../../shared/middleware/validationMiddleware";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "./auth.schema";
import { authenticate } from "../../shared/middleware/authMiddleware";
import { authLimiter, forgotPasswordLimiter, resetPasswordLimiter } from "../../shared/middleware/rateLimitMiddleware";

const router = Router();

router.post("/register", authLimiter, validateBody(registerSchema), authController.register);
router.post("/login", authLimiter, validateBody(loginSchema), authController.login);
router.post("/refresh", authenticate, authController.refresh);
router.post("/forgot-password", forgotPasswordLimiter, validateBody(forgotPasswordSchema), authController.forgotPassword);
router.post("/reset-password", resetPasswordLimiter, validateBody(resetPasswordSchema), authController.resetPassword);

export default router;