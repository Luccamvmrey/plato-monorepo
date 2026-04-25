import prisma from "@plato/database";
import { AppError } from "../../shared/error/AppError";
import { ensureOwnership } from "../../shared/utils/auth";

const WORKOUT_INCLUDE = {
    workoutExercise: {
        include: { exercise: true }
    }
} as const;

const create = async (userId: number, data: any) => {
    const { exercises, ...workoutData } = data;

    return prisma.workout.create({
        data: {
            ...workoutData,
            user: { connect: { id: userId } },
            workoutExercise: {
                create: exercises.map((ex: any) => ({
                    exerciseId: ex.exerciseId,
                    orderIndex: ex.orderIndex,
                    targetSets: ex.targetSets,
                    targetReps: ex.targetReps
                }))
            }
        },
        include: WORKOUT_INCLUDE
    })
}

const getByUserId = async (userId: number, isActive?: boolean) => {
    return prisma.workout.findMany({
        where: { 
            userId,
            ...(isActive !== undefined ? { isActive } : {})
        },
        include: WORKOUT_INCLUDE,
    });
}

const getById = async (workoutId: number) => {
    return prisma.workout.findUnique({
        where: { id: workoutId },
        include: WORKOUT_INCLUDE
    });
}

const toggleStatus = async (userId: number, workoutId: number) => {
    const workout = await prisma.workout.findUnique({ where: { id: workoutId } });

    ensureOwnership(workout, userId, "This workout does not belong to the user");

    return prisma.workout.update({
        where: { id: workoutId },
        data: { isActive: !workout.isActive },
        include: WORKOUT_INCLUDE
    });
}

const update = async (userId: number, workoutId: number, data: any) => {
    const { exercises, ...workoutData } = data;
    const workout = await prisma.workout.findUnique({ where: { id: workoutId } });

    ensureOwnership(workout, userId, "This workout does not belong to the user");

    await prisma.$transaction(async (tx) => {
        await tx.workoutExercise.deleteMany({ where: { workoutId } });
        await tx.workout.update({ where: { id: workoutId }, data: workoutData });
        await tx.workoutExercise.createMany({
            data: exercises.map((ex: any) => ({
                workoutId: workoutId,
                exerciseId: ex.exerciseId,
                orderIndex: ex.orderIndex,
                targetSets: ex.targetSets,
                targetReps: ex.targetReps
            }))
        })
    });

    return getById(workoutId);
}

const remove = async (userId: number, workoutId: number) => {
    const workout = await prisma.workout.findUnique({ where: { id: workoutId } });

    ensureOwnership(workout, userId, "This workout does not belong to the user");

    await prisma.workout.delete({ where: { id: workoutId } });
}

export { create, getByUserId, getById, update, remove, toggleStatus }