import prisma from "@plato/database";
import { AppError } from "../../../shared/error/AppError";
import { ensureOwnership } from "../../../shared/utils/auth";

// Renomeado para 'payload' para clareza
const create = async (userId: number, payload: any) => {
    const workoutSession = await prisma.workoutSession.findUnique({
        where: { id: payload.workoutSessionId },
    });

    if (!workoutSession) {
        throw new AppError("Workout session not found", 404);
    }

    // Sem esta checagem qualquer usuário autenticado gravava série na sessão aberta
    // de outro — e a série contaminava PR e progressão da vítima. Mesma família das
    // falhas de posse corrigidas em /users e /workouts.
    ensureOwnership(workoutSession, userId, "This workout session does not belong to the user");

    if (workoutSession.completedAt !== null) {
        throw new AppError("Cannot add sets to a complete workout session", 400);
    }

    // O envelopamento estrutural obrigatório exigido pelo Prisma
    return prisma.sessionSet.create({
        data: payload
    });
}

const update = async (userId: number, id: number, payload: any) => {
    const sessionSet = await prisma.sessionSet.findUnique({
        where: { id },
        include: { workoutSession: true }
    });

    ensureOwnership(sessionSet?.workoutSession, userId);

    return prisma.sessionSet.update({
        where: { id },
        data: payload // O envelopamento também se aplica ao update
    });
}

export { create, update };