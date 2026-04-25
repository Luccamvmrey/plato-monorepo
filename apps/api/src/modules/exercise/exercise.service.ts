import prisma from "@plato/database";
import { AppError } from "../../shared/error/AppError";

const getAll = async () => {
    return prisma.exercise.findMany({ orderBy: { name: "asc" } })
}

const create = async (data: any) => {
    const exists = await prisma.exercise.findUnique({ where: { name: data.name } });
    if (exists) throw new AppError("Exercise already exists", 409);

    return prisma.exercise.create({ data });
}

const update = async (id: number, data: any) => {
    return prisma.exercise.update({ where: { id }, data });
}

const remove = async (id: number) => {
    return prisma.exercise.delete({ where: { id } });
}

export { getAll, create, update, remove };