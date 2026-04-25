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

const finishSession = async (userId: number, workoutSessionId: number) => {
    const now = new Date();
    const result = await prisma.workoutSession.update({
        where: { id: workoutSessionId, userId },
        data: { completedAt: now },
        include: SESSION_INCLUDE
    });

    // Fire and forget PR scanning
    scanForRecords(userId, workoutSessionId).catch(err => console.error("PR Scanning background error:", err));

    return result;
}

const deleteSession = async (userId: number, workoutSessionId: number) => {
    return prisma.workoutSession.delete({
        where: { id: workoutSessionId, userId }
    });
}

export { create, listByUserId, listByWorkoutId, listById, findActiveSession, finishSession, deleteSession };