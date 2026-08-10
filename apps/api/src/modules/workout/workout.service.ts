import prisma from "@plato/database";
import { ensureOwnership } from "../../shared/utils/auth";
import { CreateWorkoutInput, UpdateWorkoutInput } from "./workout.schema";
import { CreateWorkoutExerciseInput } from "./workout-exercise/workout-exercise.schema";

const WORKOUT_INCLUDE = {
    workoutExercise: {
        include: { exercise: true }
    }
} as const;

// O schema Zod expõe `observations` (plural) e a coluna do Prisma é `observation`.
// Sem este mapa o campo era validado, aceito e descartado em silêncio.
const toWorkoutExerciseRow = (ex: CreateWorkoutExerciseInput) => ({
    exerciseId: ex.exerciseId,
    orderIndex: ex.orderIndex,
    targetSets: ex.targetSets,
    targetReps: ex.targetReps,
    observation: ex.observations ?? null,
});

const create = async (userId: number, data: CreateWorkoutInput) => {
    const { exercises, ...workoutData } = data;

    return prisma.workout.create({
        data: {
            ...workoutData,
            user: { connect: { id: userId } },
            workoutExercise: {
                create: exercises.map(toWorkoutExerciseRow)
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

const getById = async (workoutId: number, userId: number) => {
    const workout = await prisma.workout.findUnique({
        where: { id: workoutId },
        include: WORKOUT_INCLUDE
    });

    ensureOwnership(workout, userId, "This workout does not belong to the user");

    return workout;
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

const update = async (userId: number, workoutId: number, data: UpdateWorkoutInput) => {
    const { exercises, ...workoutData } = data;
    const workout = await prisma.workout.findUnique({ where: { id: workoutId } });

    ensureOwnership(workout, userId, "This workout does not belong to the user");

    await prisma.$transaction(async (tx) => {
        await tx.workoutExercise.deleteMany({ where: { workoutId } });
        await tx.workout.update({ where: { id: workoutId }, data: workoutData });
        await tx.workoutExercise.createMany({
            data: exercises.map(ex => ({ workoutId, ...toWorkoutExerciseRow(ex) }))
        })
    });

    return getById(workoutId, userId);
}

const remove = async (userId: number, workoutId: number) => {
    const workout = await prisma.workout.findUnique({ where: { id: workoutId } });

    ensureOwnership(workout, userId, "This workout does not belong to the user");

    await prisma.workout.delete({ where: { id: workoutId } });
}

export { create, getByUserId, getById, update, remove, toggleStatus }
