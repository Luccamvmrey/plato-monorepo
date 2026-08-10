import prisma from "@plato/database";
import { AppError } from "../../shared/error/AppError";
import { ensureOwnership } from "../../shared/utils/auth";
import { scanForRecords } from "./personal-record.service";

const SESSION_INCLUDE = {
    sessionSet: {
        include: { exercise: true }
    }
} as const;

const SESSION_WITH_WORKOUT_INCLUDE = {
    workout: true,
    ...SESSION_INCLUDE
} as const;

const create = async (userId: number, data: any) => {
    const workout = await prisma.workout.findFirst({
        where: { id: data.workoutId, userId }
    });

    ensureOwnership(workout, userId, "Unauthorized to start this workout");

    const existingOpenSession = await prisma.workoutSession.findFirst({
        where: {
            userId,
            completedAt: null
        }
    });
    if (existingOpenSession) {
        throw new AppError("You have an open workout session. Please finish it before starting a new one.", 400);
    }

    const lastSession = await prisma.workoutSession.findFirst({
        where: {
            userId,
            workoutId: data.workoutId,
            completedAt: { not: null }
        },
        orderBy: { completedAt: "desc" },
        include: SESSION_INCLUDE
    });

    const newSession = await prisma.workoutSession.create({
        data: {
            user: { connect: { id: userId } },
            workout: { connect: { id: data.workoutId } }
        }
    });

    return {
        newSession,
        lastSession
    }
}

const listByUserId = async (userId: number, filters?: { workoutId?: number; startDate?: Date; endDate?: Date }) => {
    return prisma.workoutSession.findMany({
        where: { 
            userId,
            ...(filters?.workoutId ? { workoutId: filters.workoutId } : {}),
            ...(filters?.startDate || filters?.endDate ? {
                startedAt: {
                    ...(filters.startDate ? { gte: filters.startDate } : {}),
                    ...(filters.endDate ? { lte: filters.endDate } : {})
                }
            } : {})
        },
        orderBy: { startedAt: "desc" },
        include: SESSION_WITH_WORKOUT_INCLUDE
    });
}

const listByWorkoutId = async (userId: number, workoutId: number) => {
    return prisma.workoutSession.findMany({
        where: { workoutId, userId, completedAt: { not: null } },
        orderBy: { completedAt: "desc" },
        include: SESSION_INCLUDE
    });
}

const listById = async (userId: number, workoutSessionId: number) => {
    return prisma.workoutSession.findUnique({
        where: { id: workoutSessionId, userId },
        include: SESSION_INCLUDE
    });
}

const findActiveSession = async (userId: number) => {
    const activeSession = await prisma.workoutSession.findFirst({
        where: { userId, completedAt: null },
        include: SESSION_INCLUDE
    });

    if (!activeSession) return null;

    const lastSession = await prisma.workoutSession.findFirst({
        where: {
            userId,
            workoutId: activeSession.workoutId,
            completedAt: { not: null }
        },
        orderBy: { completedAt: "desc" },
        include: SESSION_INCLUDE
    });

    return {
        activeSession,
        lastSession
    };
}

const finishSession = async (userId: number, workoutSessionId: number, body: { sets: Array<{
    workoutSessionId: number;
    exerciseId: number;
    setNumber: number;
    actualReps: number;
    actualWeight: number;
    equipmentWeight?: number;
    rpe: number;
    userObservation?: string;
}> }) => {
    const existing = await prisma.workoutSession.findUnique({
        where: { id: workoutSessionId, userId },
        include: SESSION_INCLUDE,
    });

    if (!existing) throw new AppError("Workout session not found", 404);

    // Idempotency: if already completed, return without creating duplicate sets
    if (existing.completedAt !== null) return existing;

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
        if (body.sets.length > 0) {
            await tx.sessionSet.createMany({
                data: body.sets.map((set) => ({
                    workoutSessionId,
                    exerciseId:      set.exerciseId,
                    setNumber:       set.setNumber,
                    actualReps:      set.actualReps,
                    actualWeight:    set.actualWeight,
                    equipmentWeight: set.equipmentWeight ?? null,
                    rpe:             set.rpe,
                    userObservation: set.userObservation ?? null,
                })),
            });
        }

        return tx.workoutSession.update({
            where: { id: workoutSessionId, userId },
            data:  { completedAt: now },
            include: SESSION_INCLUDE,
        });
    });

    // Fire and forget PR scanning
    scanForRecords(userId, workoutSessionId).catch((err) =>
        console.error("PR Scanning background error:", err)
    );

    return result;
}

/**
 * Últimas N execuções completas de cada exercício do treino, agrupadas por exerciseId.
 * Alimenta a prescrição de carga no treino ativo.
 *
 * O histórico é escopado ao TREINO, não ao exercício globalmente: se o mesmo
 * exercício aparece em dois treinos, cada um progride de forma independente.
 * É o comportamento desejado — volume e frequência diferem por treino — e mantém
 * tudo numa query só.
 */
const getExerciseHistoryByWorkout = async (userId: number, workoutId: number, limit = 4) => {
    const sessions = await prisma.workoutSession.findMany({
        where: { userId, workoutId, completedAt: { not: null } },
        orderBy: { completedAt: "desc" },
        take: limit,
        select: {
            id: true,
            completedAt: true,
            sessionSet: {
                // Séries marcadas como inválidas ficam fora da progressão, do mesmo
                // jeito que ficam fora do PR — senão o motor prescreve a partir de
                // dado que já reconhecemos como não confiável.
                where: { excludedFromRecords: false },
                // SessionSet não tem timestamp — setNumber é a única ordem confiável.
                orderBy: { setNumber: "asc" },
                select: {
                    exerciseId:      true,
                    setNumber:       true,
                    actualReps:      true,
                    actualWeight:    true,
                    equipmentWeight: true,
                    rpe:             true,
                }
            }
        }
    });

    // Reagrupa por exercício preservando a ordem das sessões (mais recente primeiro).
    const history: Record<number, Array<{
        sessionId: number;
        completedAt: Date;
        sets: Array<Omit<(typeof sessions)[number]["sessionSet"][number], "exerciseId">>;
    }>> = {};

    for (const session of sessions) {
        for (const { exerciseId, ...set } of session.sessionSet) {
            if (!history[exerciseId]) history[exerciseId] = [];

            const executions = history[exerciseId];
            const current = executions[executions.length - 1];

            if (current?.sessionId === session.id) {
                current.sets.push(set);
            } else {
                executions.push({
                    sessionId:   session.id,
                    completedAt: session.completedAt!,
                    sets:        [set],
                });
            }
        }
    }

    return history;
}

const listByExerciseId = async (userId: number, exerciseId: number) => {
    return prisma.workoutSession.findMany({
        where: {
            userId,
            completedAt: { not: null },
            sessionSet: { some: { exerciseId } }
        },
        include: {
            sessionSet: {
                where: { exerciseId },
                include: { exercise: true }
            }
        },
        orderBy: { completedAt: "asc" }
    });
}

const deleteSession = async (userId: number, workoutSessionId: number) => {
    return prisma.workoutSession.delete({
        where: { id: workoutSessionId, userId }
    });
}

export { create, listByUserId, listByWorkoutId, listById, findActiveSession, finishSession, listByExerciseId, getExerciseHistoryByWorkout, deleteSession };