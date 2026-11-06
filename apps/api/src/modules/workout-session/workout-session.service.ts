import prisma, { Prisma } from "@plato/database";
import { decideOpenSession, normalizeLastSetAt, resolveCompletedAt } from "@plato/shared";
import { AppError } from "../../shared/error/AppError";
import { ensureOwnership } from "../../shared/utils/auth";
import { scanForRecords } from "./personal-record.service";
import { findActiveProgramIdForWorkout } from "../program/program.service";
import { sessionSetsSchema, type SaveDraftInput, type SessionSetsInput } from "./workout-session.schema";

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
            groupKey:    true,
            groupType:   true,
        }
    });

    // O modo é preferência da pessoa, não do treino. Copiado para a sessão porque
    // trocar a preferência depois não pode mudar como uma sessão já foi registrada.
    const user = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { trackingMode: true },
    });

    const newSession = await prisma.workoutSession.create({
        data: {
            user: { connect: { id: userId } },
            workout: { connect: { id: data.workoutId } },
            trackingMode: user.trackingMode,
            ...(programId !== null ? { program: { connect: { id: programId } } } : {}),
            sessionExercise: {
                // orderIndex derivado da POSIÇÃO, não copiado do plano: o do plano vem
                // do cliente e um valor repetido violaria @@unique([workoutSessionId,
                // orderIndex]) — o que faria falhar o início do treino, não o snapshot.
                // `groupKey` é copiado como está. A ordem do snapshot é a mesma do
                // plano, então a contiguidade que define o grupo se preserva; e o
                // plano já foi normalizado na escrita, então não há chave órfã aqui.
                create: planned.map((exercise, index) => ({
                    exerciseId:  exercise.exerciseId,
                    orderIndex:  index + 1,
                    targetSets:  exercise.targetSets,
                    targetReps:  exercise.targetReps,
                    observation: exercise.observation,
                    groupKey:    exercise.groupKey,
                    groupType:   exercise.groupType,
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
        include: SESSION_WITH_WORKOUT_INCLUDE
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

type SessionForClosing = { id: number; userId: number; trackingMode: "FULL" | "SIMPLE" };

const parseDraft = (draft: unknown): SessionSetsInput => sessionSetsSchema.parse(draft ?? []);

const ensureSetsMatchMode = (isSimple: boolean, sets: SessionSetsInput) => {
    if (!isSimple && sets.some((set) => set.actualWeight === null || set.rpe === null)) {
        throw new AppError("Weight and RPE are required in full tracking mode", 400);
    }
};

const writeSets = async (tx: Prisma.TransactionClient, session: SessionForClosing, sets: SessionSetsInput) => {
    if (sets.length === 0) return;

    // O modo vem da sessão, nunca do cliente: é ele que decide o que entra em PR e
    // progressão, e um campo enviado pelo cliente poderia contaminar os dois.
    const isSimple = session.trackingMode === "SIMPLE";

    const snapshot = await tx.sessionExercise.findMany({
        where:   { workoutSessionId: session.id },
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
        data: sets.map((set) => ({
            workoutSessionId: session.id,
            exerciseId:      set.exerciseId,
            // null aqui significa coisas diferentes conforme a sessão tenha ou
            // não snapshot: sessão legada vs. série fora do plano.
            sessionExerciseId: sessionExerciseByExercise.get(set.exerciseId) ?? null,
            setNumber:       set.setNumber,
            actualReps:      set.actualReps,
            actualWeight:    set.actualWeight,
            equipmentWeight: set.equipmentWeight ?? null,
            rpe:             isSimple ? null : set.rpe,
            userObservation: set.userObservation ?? null,
            // As reps do modo simplificado são presumidas, não medidas.
            excludedFromRecords: isSimple,
        })),
    });
};

const scanInBackground = (userId: number, workoutSessionId: number) => {
    scanForRecords(userId, workoutSessionId).catch((err) =>
        console.error("PR Scanning background error:", err)
    );
};

/**
 * O único caminho que conclui uma sessão, seja a pessoa ou o agendador. A condição em
 * `completedAt` é o que impede os dois de gravarem as séries em dobro: quem chega depois não
 * altera nada e devolve `false`.
 */
const completeSession = async (
    session: SessionForClosing,
    sets: SessionSetsInput,
    completedAt: Date,
    autoCompleted: boolean
): Promise<boolean> => {
    const didComplete = await prisma.$transaction(async (tx) => {
        const { count } = await tx.workoutSession.updateMany({
            where: { id: session.id, completedAt: null },
            data:  { completedAt, autoCompleted, draftSets: Prisma.DbNull },
        });

        if (count === 0) return false;

        await writeSets(tx, session, sets);

        return true;
    });

    if (didComplete) scanInBackground(session.userId, session.id);

    return didComplete;
};

/**
 * O agendador fecha com o que o servidor tem. Se o aparelho estava sem rede, ele chega depois
 * com mais séries, e são elas que valem: sem isso, parte do treino se perderia.
 */
const applyLateSets = async (
    session: SessionForClosing & { autoCompleted: boolean; sessionSet: unknown[] },
    sets: SessionSetsInput,
    lastSetAt: number | null
) => {
    if (!session.autoCompleted || sets.length <= session.sessionSet.length) return;

    await prisma.$transaction(async (tx) => {
        await tx.sessionSet.deleteMany({ where: { workoutSessionId: session.id } });
        await writeSets(tx, session, sets);

        if (lastSetAt !== null) {
            await tx.workoutSession.update({ where: { id: session.id }, data: { completedAt: new Date(lastSetAt) } });
        }
    });

    scanInBackground(session.userId, session.id);
};

const finishSession = async (userId: number, workoutSessionId: number, body: {
    sets: SessionSetsInput;
    lastSetAt?: number | null;
}) => {
    const existing = await prisma.workoutSession.findUnique({
        where: { id: workoutSessionId, userId },
        include: SESSION_INCLUDE,
    });

    if (!existing) throw new AppError("Workout session not found", 404);

    const now = Date.now();
    const startedAt = existing.startedAt.getTime();
    const lastSetAt = normalizeLastSetAt(body.lastSetAt ?? existing.lastSetAt?.getTime(), startedAt, now);

    ensureSetsMatchMode(existing.trackingMode === "SIMPLE", body.sets);

    // Idempotency: if already completed, return without creating duplicate sets
    if (existing.completedAt !== null) {
        await applyLateSets(existing, body.sets, lastSetAt);
    } else {
        // Sem séries no aparelho (outro celular, dados limpos), vale o que já foi enviado.
        const sets = body.sets.length > 0 ? body.sets : parseDraft(existing.draftSets);

        await completeSession(existing, sets, new Date(resolveCompletedAt(startedAt, lastSetAt, now)), false);
    }

    return prisma.workoutSession.findUniqueOrThrow({
        where: { id: workoutSessionId, userId },
        include: SESSION_INCLUDE,
    });
}

const saveDraft = async (userId: number, workoutSessionId: number, { sets, lastSetAt }: SaveDraftInput) => {
    const existing = await prisma.workoutSession.findUnique({
        where: { id: workoutSessionId, userId },
        include: { sessionSet: { select: { id: true } } },
    });

    if (!existing) throw new AppError("Workout session not found", 404);

    ensureSetsMatchMode(existing.trackingMode === "SIMPLE", sets);

    const normalized = normalizeLastSetAt(lastSetAt, existing.startedAt.getTime(), Date.now());

    if (existing.completedAt !== null) {
        await applyLateSets(existing, sets, normalized);
        return;
    }

    await prisma.workoutSession.updateMany({
        where: { id: workoutSessionId, completedAt: null },
        data: {
            draftSets: sets,
            ...(normalized !== null ? { lastSetAt: new Date(normalized) } : {}),
        },
    });
};

/**
 * Fecha quem esqueceu de concluir e descarta quem nunca registrou uma série. Só olha sessões
 * com rascunho: nas outras, as séries podem estar só no aparelho. Devolve as que fechou.
 */
const closeIdleSessions = async (now: Date) => {
    const sessions = await prisma.workoutSession.findMany({
        where: { completedAt: null, draftSets: { not: Prisma.DbNull } },
        select: { id: true, userId: true, trackingMode: true, startedAt: true, lastSetAt: true, draftSets: true },
    });

    const closed: { userId: number; setCount: number }[] = [];

    for (const session of sessions) {
        try {
            const sets = parseDraft(session.draftSets);
            const lastSetAt = session.lastSetAt?.getTime() ?? null;
            const action = decideOpenSession({
                startedAt: session.startedAt.getTime(),
                lastSetAt,
                draftSetCount: sets.length,
                now: now.getTime(),
            });

            if (action === "DISCARD") {
                // `lastSetAt: null` cobre a série que tenha chegado depois da leitura acima.
                await prisma.workoutSession.deleteMany({ where: { id: session.id, completedAt: null, lastSetAt: null } });
            }

            if (action === "CLOSE") {
                const completedAt = new Date(lastSetAt ?? session.startedAt.getTime());

                if (await completeSession(session, sets, completedAt, true)) {
                    closed.push({ userId: session.userId, setCount: sets.length });
                }
            }
        } catch (error) {
            console.error(`Could not close session ${session.id}`, error);
        }
    }

    return closed;
};

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

export { create, listByUserId, listByWorkoutId, listById, findActiveSession, finishSession, saveDraft, closeIdleSessions, listByExerciseId, getExerciseHistoryByWorkout, getExerciseHistoryForSession, deleteSession };