import { Router } from "express";
import { authenticate } from "../../shared/middleware/authMiddleware";
import * as userController from "./user.controller";
import { validateBody } from "../../shared/middleware/validationMiddleware";
import { updateUserSchema } from "../auth/auth.schema";

const router = Router();

router.use(authenticate);

router.get('/profile', userController.profile);
router.get('/stats', userController.stats);
router.get('/streak', userController.streak);
router.get('/export', userController.exportData);
router.delete('/account', userController.deleteAccount);

router.get('/', userController.list);
router.get('/:id', userController.getById);
router.put('/:id', validateBody(updateUserSchema), userController.update);

export default router;
