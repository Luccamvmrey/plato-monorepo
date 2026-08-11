import { Router } from "express";
import * as programController from "./program.controller";
import { authenticate } from "../../shared/middleware/authMiddleware";
import { validateBody } from "../../shared/middleware/validationMiddleware";
import { createProgramSchema, updateProgramSchema } from "./program.schema";

const router = Router();

router.use(authenticate);

// Precisa vir ANTES de '/:id'. Mesma pegadinha de `user.routes.ts`: uma rota literal
// registrada depois casa com '/:id' e o extractId estoura no texto — e como ele lança
// Error puro, o resultado seria 500 em vez de 400.
router.get("/active/next", programController.getActiveNext);

router.get("/", programController.getByUserId);
router.post("/", validateBody(createProgramSchema), programController.create);
router.get("/:id", programController.getById);
router.put("/:id", validateBody(updateProgramSchema), programController.update);
router.patch("/:id/activate", programController.activate);
router.patch("/:id/deactivate", programController.deactivate);
router.delete("/:id", programController.remove);

export default router;
