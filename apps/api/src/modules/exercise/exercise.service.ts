import prisma from "@plato/database";
import { MuscleGroup } from "@plato/database";
import { AppError } from "../../shared/error/AppError";

type CreateExerciseData = {
    name: string;
    targetMuscle: MuscleGroup;
    secondaryMuscles?: MuscleGroup[];
};

const getAll = async () => {
    return prisma.exercise.findMany({ orderBy: { name: "asc" } });
}

const create = async (data: CreateExerciseData) => {
    const exists = await prisma.exercise.findUnique({ where: { name: data.name } });
    if (exists) throw new AppError("Exercise already exists", 409);

    return prisma.exercise.create({ data });
}

const bulkCreate = async (exercises: CreateExerciseData[]) => {
    return prisma.exercise.createMany({
        data: exercises,
        skipDuplicates: true,
    });
}

const update = async (id: number, data: Partial<CreateExerciseData>) => {
    return prisma.exercise.update({ where: { id }, data });
}

const remove = async (id: number) => {
    return prisma.exercise.delete({ where: { id } });
}

export { getAll, create, bulkCreate, update, remove };