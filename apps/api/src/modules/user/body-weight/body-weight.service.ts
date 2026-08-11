import prisma from "@plato/database";
import { resolveBodyWeightAt } from "@plato/shared";
import { AppError } from "../../../shared/error/AppError";
import { CreateBodyWeightInput } from "./body-weight.schema";

const list = async (userId: number) => {
    return prisma.bodyWeightLog.findMany({
        where: { userId },
        orderBy: { measuredAt: "desc" },
    });
}

const create = async (userId: number, data: CreateBodyWeightInput) => {
    return prisma.bodyWeightLog.create({
        data: {
            userId,
            weight: data.weight,
            measuredAt: data.measuredAt ?? new Date(),
        },
    });
}

const remove = async (userId: number, id: number) => {
    const log = await prisma.bodyWeightLog.findUnique({ where: { id } });

    if (!log) throw new AppError("Body weight log not found", 404);
    if (log.userId !== userId) {
        throw new AppError("This body weight log does not belong to the user", 403);
    }

    await prisma.bodyWeightLog.delete({ where: { id } });
}

/**
 * Resolvedor de peso corporal por data para um usuário.
 *
 * Uma query só, e a resolução acontece em memória — o cálculo de carga efetiva
 * precisa disso por série, e uma query por série seria centenas de idas ao banco
 * numa única tela de analytics.
 */
const createResolver = async (userId: number) => {
    const logs = await prisma.bodyWeightLog.findMany({
        where: { userId },
        select: { weight: true, measuredAt: true },
        orderBy: { measuredAt: "asc" },
    });

    return (date: Date | string | null | undefined) => resolveBodyWeightAt(logs, date);
}

export { list, create, remove, createResolver };
