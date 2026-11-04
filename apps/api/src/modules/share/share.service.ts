import { randomBytes } from "crypto";
import prisma from "@plato/database";
import { isShareToken, normalizeExerciseGroups } from "@plato/shared";
import { AppError } from "../../shared/error/AppError";
import { ensureOwnership } from "../../shared/utils/auth";
import { toWorkoutExerciseRows } from "../workout/workout.service";
import { CreateShareInput } from "./share.schema";

/**
 * O que qualquer pessoa com o link enxerga. É um `select` fechado de propósito: nada do
 * autor entra aqui, e campo novo no modelo só aparece se alguém o escrever nesta lista.
 */
const PUBLIC_PLAN_SELECT = {
    token: true,
    kind: true,
    name: true,
    description: true,
    curatedKey: true,
    focusLabel: true,
    sessionsPerWeek: true,
    workouts: {
        orderBy: { orderIndex: "asc" },
        select: {
            orderIndex: true,
            name: true,
            description: true,
            exercises: {
                orderBy: { orderIndex: "asc" },
                select: {
                    orderIndex: true,
                    targetSets: true,
                    targetReps: true,
                    observation: true,
                    groupKey: true,
                    groupType: true,
                    exercise: {
                        select: { name: true, targetMuscle: true, repUnit: true },
                    },
                },
            },
        },
    },
} as const;

const OWN_LINK_SELECT = {
    id: true,
    token: true,
    kind: true,
    name: true,
    createdAt: true,
    viewCount: true,
    _count: { select: { copiedWorkouts: true, copiedPrograms: true } },
} as const;

type OwnLinkRow = {
    id: number;
    token: string;
    kind: "WORKOUT" | "PROGRAM";
    name: string;
    createdAt: Date;
    viewCount: number;
    _count: { copiedWorkouts: number; copiedPrograms: number };
};

const toOwnLink = ({ _count, ...link }: OwnLinkRow) => ({
    ...link,
    addCount: link.kind === "PROGRAM" ? _count.copiedPrograms : _count.copiedWorkouts,
});

/** Mesma resposta para link inexistente e revogado: não confirma que o token existiu. */
const notFound = () => new AppError("This link is not available", 404);

type SourceExercise = {
    exerciseId: number;
    orderIndex: number;
    targetSets: number;
    targetReps: number;
    observation: string | null;
    groupKey: string | null;
    groupType: "SUPERSET" | "REST_PAUSE" | null;
};

type SourceWorkout = {
    name: string;
    description: string | null;
    workoutExercise: SourceExercise[];
};

/** Linhas ordenadas e com grupos normalizados: fora de ordem, um bi-set se dissolveria. */
const toSnapshotWorkout = (workout: SourceWorkout, index: number) => {
    if (workout.workoutExercise.length === 0) {
        throw new AppError(`Workout "${workout.name}" has no exercises to share`, 400);
    }

    return {
        orderIndex: index + 1,
        name: workout.name,
        description: workout.description,
        exercises: {
            create: normalizeExerciseGroups(
                [...workout.workoutExercise]
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map(({ exerciseId, orderIndex, targetSets, targetReps, observation, groupKey, groupType }) => ({
                        exerciseId,
                        orderIndex,
                        targetSets,
                        targetReps,
                        observation,
                        groupKey,
                        groupType,
                    }))
            ),
        },
    };
};

const loadWorkoutSource = async (userId: number, workoutId: number) => {
    const workout = await prisma.workout.findUnique({
        where: { id: workoutId },
        include: { workoutExercise: true },
    });

    ensureOwnership(workout, userId, "This workout does not belong to the user");

    return { name: workout!.name, description: workout!.description, workouts: [workout!] };
};

const loadProgramSource = async (userId: number, programId: number) => {
    const program = await prisma.program.findUnique({
        where: { id: programId },
        include: {
            programWorkout: {
                orderBy: { orderIndex: "asc" },
                include: { workout: { include: { workoutExercise: true } } },
            },
        },
    });

    ensureOwnership(program, userId, "This program does not belong to the user");

    if (program!.programWorkout.length === 0) {
        throw new AppError("This program has no workouts to share", 400);
    }

    return {
        name: program!.name,
        description: program!.description,
        workouts: program!.programWorkout.map((entry) => entry.workout),
    };
};

const create = async (userId: number, { kind, sourceId }: CreateShareInput) => {
    const source = kind === "WORKOUT"
        ? await loadWorkoutSource(userId, sourceId)
        : await loadProgramSource(userId, sourceId);

    const plan = await prisma.sharedPlan.create({
        data: {
            token: randomBytes(16).toString("base64url"),
            kind,
            name: source.name,
            description: source.description,
            userId,
            workouts: { create: source.workouts.map(toSnapshotWorkout) },
        },
        select: OWN_LINK_SELECT,
    });

    return toOwnLink(plan);
};

const getOwnLinks = async (userId: number) => {
    const links = await prisma.sharedPlan.findMany({
        where: { userId, revokedAt: null },
        orderBy: { createdAt: "desc" },
        select: OWN_LINK_SELECT,
    });

    return links.map(toOwnLink);
};

const revoke = async (userId: number, planId: number) => {
    const plan = await prisma.sharedPlan.findUnique({
        where: { id: planId },
        select: { userId: true, revokedAt: true },
    });

    ensureOwnership(plan, userId, "This link does not belong to the user");

    if (plan!.revokedAt) return;

    await prisma.sharedPlan.update({ where: { id: planId }, data: { revokedAt: new Date() } });
};

const getPublic = async (token: string) => {
    const plan = await prisma.sharedPlan.findFirst({
        where: { token, revokedAt: null },
        select: PUBLIC_PLAN_SELECT,
    });

    if (!plan) throw notFound();

    // A contagem não pode atrasar nem derrubar a abertura do link.
    prisma.sharedPlan
        .update({ where: { token }, data: { viewCount: { increment: 1 } } })
        .catch((error: unknown) => console.error("Failed to count shared plan view", error));

    const { curatedKey, ...publicPlan } = plan;

    return { ...publicPlan, isCurated: curatedKey !== null };
};

const getFeatured = async () => {
    const plans = await prisma.sharedPlan.findMany({
        where: { featuredOrder: { not: null }, curatedKey: { not: null }, revokedAt: null },
        orderBy: { featuredOrder: "asc" },
        select: {
            token: true,
            name: true,
            description: true,
            focusLabel: true,
            sessionsPerWeek: true,
            _count: { select: { workouts: true } },
        },
    });

    return plans.map(({ _count, ...plan }) => ({ ...plan, workoutCount: _count.workouts }));
};

/**
 * Cria cópias próprias do plano. Pedir de novo devolve a cópia existente, porque o toque
 * duplo e a volta do cadastro não podem encher a biblioteca. Quem apagou a cópia pode
 * adicionar outra.
 */
const addToLibrary = async (userId: number, token: string) => {
    const plan = await prisma.sharedPlan.findFirst({
        where: { token, revokedAt: null },
        include: {
            workouts: {
                orderBy: { orderIndex: "asc" },
                include: { exercises: { orderBy: { orderIndex: "asc" } } },
            },
        },
    });

    if (!plan) throw notFound();

    if (plan.kind === "WORKOUT") {
        const existing = await prisma.workout.findFirst({
            where: { userId, sourcePlanId: plan.id },
            select: { id: true },
        });

        if (existing) return { kind: plan.kind, alreadyAdded: true, activated: false };
    } else {
        const existing = await prisma.program.findFirst({
            where: { userId, sourcePlanId: plan.id },
            select: { isActive: true },
        });

        if (existing) return { kind: plan.kind, alreadyAdded: true, activated: existing.isActive };
    }

    return prisma.$transaction(async (tx) => {
        const workoutIds: number[] = [];

        // Em sequência, não com Promise.all: os ids precisam sair na ordem da rotação.
        for (const workout of plan.workouts) {
            const copy = await tx.workout.create({
                data: {
                    name: workout.name,
                    description: workout.description,
                    sourcePlan: { connect: { id: plan.id } },
                    user: { connect: { id: userId } },
                    workoutExercise: {
                        create: toWorkoutExerciseRows(workout.exercises.map((exercise) => ({
                            exerciseId: exercise.exerciseId,
                            orderIndex: exercise.orderIndex,
                            targetSets: exercise.targetSets,
                            targetReps: exercise.targetReps,
                            observations: exercise.observation ?? undefined,
                            groupKey: exercise.groupKey,
                            groupType: exercise.groupType,
                        }))),
                    },
                },
                select: { id: true },
            });

            workoutIds.push(copy.id);
        }

        if (plan.kind === "WORKOUT") {
            return { kind: plan.kind, alreadyAdded: false, activated: false };
        }

        // Só ativa para quem não tem rotação: adicionar não pode trocar a que está em uso.
        const activeCount = await tx.program.count({ where: { userId, isActive: true } });
        const activated = activeCount === 0;

        await tx.program.create({
            data: {
                name: plan.name,
                description: plan.description,
                isActive: activated,
                sourcePlan: { connect: { id: plan.id } },
                user: { connect: { id: userId } },
                programWorkout: {
                    create: workoutIds.map((workoutId, index) => ({ workoutId, orderIndex: index + 1 })),
                },
            },
        });

        return { kind: plan.kind, alreadyAdded: false, activated };
    });
};

/** O mínimo para o preview do link. Não soma visita: quem chega aqui pode ser um robô. */
const getPageSummary = async (token: string) => {
    if (!isShareToken(token)) return null;

    return prisma.sharedPlan.findFirst({
        where: { token, revokedAt: null },
        select: {
            kind: true,
            name: true,
            description: true,
            curatedKey: true,
            _count: { select: { workouts: true } },
        },
    });
};

/** Link que vale para atribuir um cadastro. Token ruim nunca pode impedir a conta. */
const findPlanIdForSignup = async (token: unknown): Promise<number | null> => {
    if (!isShareToken(token)) return null;

    const plan = await prisma.sharedPlan.findFirst({
        where: { token, revokedAt: null },
        select: { id: true },
    });

    return plan?.id ?? null;
};

export { create, getOwnLinks, revoke, getPublic, getFeatured, addToLibrary, getPageSummary, findPlanIdForSignup };
