import prisma from "@plato/database";
import { AppError } from "../../shared/error/AppError";
import { ensureOwnership } from "../../shared/utils/auth";
import { scanForRecords } from "./personal-record.service";
import { findActiveProgramIdForWorkout } from "../program/program.service";

/**
 * O snapshot entra em TODOS os caminhos de leitura de sessão, inclusive os que
 * alimentam Histórico e Resumo.
 *
 * Ele foi restrito à sessão ativa quando ninguém mais o consumia; a partir dos badges
 * de origem, aquelas telas passaram a depender dele — e não só para marcar o que foi
 * trocado: um exercício prescrito e NÃO executado não tem série nenhuma, então sem o
 * snapshot ele simplesmente não existe para uma lista derivada de `sessionSet`. Era
 * exatamente essa a pergunta que não tinha resposta antes.
 *
 * O custo é pequeno perto do que já vai no mesmo payload: a lista de histórico já
 * carrega todas as séries de todas as sessões, cada uma com o exercício completo.
 */
const SESSION_INCLUDE = {
    sessionSet: {
        include: { exercise: true }
    },
    sessionExercise: {
        orderBy: { orderIndex: "asc" },
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

    // A sessão é carimbada com o programa ativo que contém este treino, se houver.
    // O cliente não manda nada: qualquer campo que ele pudesse mentir aqui viraria
    // ponteiro de rotação errado depois.
    const programId = await findActiveProgramIdForWorkout(userId, data.workoutId);

    // Snapshot da prescrição. É o que separa "o usuário pulou este exercício" de "o
    // treino foi editado depois da sessão" — hoje as duas coisas são indistinguíveis
    // porque `workout.service.update` apaga e recria as WorkoutExercise.
    const planned = await prisma.workoutExercise.findMany({
        where: { workoutId: data.workoutId },
        // Secundário por id para a ordem ser determinística mesmo se o cliente tiver
        // mandado orderIndex repetido.
        orderBy: [{ orderIndex: "asc" }, { id: "asc" }],
        select: {
            exerciseId:  true,
            targetSets:  true,
            targetReps:  true,
            observation: true,
        }
    });

    const newSession = await prisma.workoutSession.create({
        data: {
            user: { connect: { id: userId } },
            workout: { connect: { id: data.workoutId } },
            ...(programId !== null ? { program: { connect: { id: programId } } } : {}),
            sessionExercise: {
                // orderIndex derivado da POSIÇÃO, não copiado do plano: o do plano vem
                // do cliente e um valor repetido violaria @@unique([workoutSessionId,
                // orderIndex]) — o que faria falhar o início do treino, não o snapshot.
                create: planned.map((exercise, index) => ({
                    exerciseId:  exercise.exerciseId,
                    orderIndex:  index + 1,
                    targetSets:  exercise.targetSets,
                    targetReps:  exercise.targetReps,
                    observation: exercise.observation,
                }))
            }
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
            const snapshot = await tx.sessionExercise.findMany({
                where:   { workoutSessionId },
                orderBy: { orderIndex: "asc" },
                select:  { id: true, exerciseId: true },
            });

            // Um exercício não se repete dentro de um treino (verificado: zero casos
            // em produção), e a própria tela de sessão agrupa as séries por
            // exerciseId — então um plano com repetição já estaria quebrado antes
            // daqui. Se aparecer, a primeira posição vence, de forma determinística.
            const sessionExerciseByExercise = new Map<number, number>();
            for (const row of snapshot) {
                if (!sessionExerciseByExercise.has(row.exerciseId)) {
                    sessionExerciseByExercise.set(row.exerciseId, row.id);
                }
            }

            await tx.sessionSet.createMany({
                data: body.sets.map((set) => ({
                    workoutSessionId,
                    exerciseId:      set.exerciseId,
                    // null aqui significa coisas diferentes conforme a sessão tenha ou
                    // não snapshot: sessão legada vs. série fora do plano.
                    sessionExerciseId: sessionExerciseByExercise.get(set.exerciseId) ?? null,
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

/**
 * Mesmas execuções de `getExerciseHistoryByWorkout`, mas SEM escopo de treino.
 * Existe só para o exercício que entrou na sessão fora do plano: como ele não
 * pertence ao treino, o histórico escopado devolveria vazio e o card ficaria sem
 * carga de referência.
 */
const getGlobalExerciseHistory = async (userId: number, exerciseIds: number[], limit = 4) => {
    if (exerciseIds.length === 0) return {};

    const sessions = await prisma.workoutSession.findMany({
        where: {
            userId,
            completedAt: { not: null },
            sessionSet: { some: { exerciseId: { in: exerciseIds }, excludedFromRecords: false } },
        },
        orderBy: { completedAt: "desc" },
        // Teto grosseiro: o corte fino é por exercício, em memória, logo abaixo.
        take: limit * exerciseIds.length,
        select: {
            id: true,
            completedAt: true,
            sessionSet: {
                where:   { exerciseId: { in: exerciseIds }, excludedFromRecords: false },
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
            } else if (executions.length < limit) {
                executions.push({ sessionId: session.id, completedAt: session.completedAt!, sets: [set] });
            }
        }
    }

    return history;
};

/**
 * O histórico que alimenta a prescrição de UMA sessão, resolvendo cada exercício pelo
 * escopo certo.
 *
 * O escopo por treino é decisão deliberada e continua valendo para o que foi
 * prescrito: o mesmo exercício em dois treinos progride de forma independente. O que
 * muda aqui é só o exercício que entrou fora do plano — para ele, o escopo por treino
 * não tem o que dizer, e o global é a única referência que existe.
 */
const getExerciseHistoryForSession = async (userId: number, workoutSessionId: number, limit = 4) => {
    const session = await prisma.workoutSession.findUnique({
        where: { id: workoutSessionId },
        select: {
            id: true,
            userId: true,
            workoutId: true,
            sessionExercise: { select: { exerciseId: true, origin: true } },
        }
    });

    ensureOwnership(session, userId, "This workout session does not belong to the user");

    const history = await getExerciseHistoryByWorkout(userId, session!.workoutId, limit);

    const offPlan = session!.sessionExercise
        .filter((entry) => entry.origin !== "PRESCRIBED" && !history[entry.exerciseId])
        .map((entry) => entry.exerciseId);

    if (offPlan.length === 0) return history;

    return { ...history, ...(await getGlobalExerciseHistory(userId, offPlan, limit)) };
};

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

export { create, listByUserId, listByWorkoutId, listById, findActiveSession, finishSession, listByExerciseId, getExerciseHistoryByWorkout, getExerciseHistoryForSession, deleteSession };