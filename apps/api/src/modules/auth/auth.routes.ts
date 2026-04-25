import { Router } from "express";
import * as authController from "./auth.controller";
import { validateBody } from "../../shared/middleware/validationMiddleware";
import { loginSchema, registerSchema } from "./auth.schema";

const router = Router();

router.post("/register", validateBody(registerSchema), authController.register);
router.post("/login", validateBody(loginSchema), authController.login);

export default router;