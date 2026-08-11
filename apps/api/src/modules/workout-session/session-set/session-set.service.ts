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

    // Liga a série ao snapshot da prescrição, quando a sessão tem um. O outro caminho
    // de escrita (`finishSession`) faz o mesmo — se só ele ligasse, uma série gravada
    // por aqui pareceria "fora do plano" numa sessão em que ela estava prescrita.
    const sessionExercise = await prisma.sessionExercise.findFirst({
        where:   { workoutSessionId: payload.workoutSessionId, exerciseId: payload.exerciseId },
        orderBy: { orderIndex: "asc" },
        select:  { id: true },
    });

    // O envelopamento estrutural obrigatório exigido pelo Prisma
    return prisma.sessionSet.create({
        data: { ...payload, sessionExerciseId: sessionExercise?.id ?? null }
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