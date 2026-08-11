import { Router } from "express";
import { authenticate } from "../../shared/middleware/authMiddleware";
import * as userController from "./user.controller";
import { validateBody } from "../../shared/middleware/validationMiddleware";
import { updateUserSchema } from "../auth/auth.schema";
import * as bodyWeightController from "./body-weight/body-weight.controller";
import { createBodyWeightSchema } from "./body-weight/body-weight.schema";

const router = Router();

router.use(authenticate);

router.get('/profile', userController.profile);
router.get('/stats', userController.stats);
router.get('/streak', userController.streak);
router.get('/export', userController.exportData);
router.delete('/account', userController.deleteAccount);

// Precisa vir ANTES de '/:id': senão GET /body-weight casa com '/:id' e o extractId
// estoura em "body-weight".
router.get('/body-weight', bodyWeightController.list);
router.post('/body-weight', validateBody(createBodyWeightSchema), bodyWeightController.create);
router.delete('/body-weight/:id', bodyWeightController.remove);

router.get('/', userController.list);
router.get('/:id', userController.getById);
router.put('/:id', validateBody(updateUserSchema), userController.update);

export default router;
