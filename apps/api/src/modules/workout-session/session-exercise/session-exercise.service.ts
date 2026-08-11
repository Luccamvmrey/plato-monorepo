import prisma from "@plato/database";
import { AppError } from "../../../shared/error/AppError";
import { ensureOwnership } from "../../../shared/utils/auth";
import {
    AddSessionExerciseInput,
    SkipSessionExerciseInput,
    SubstituteSessionExerciseInput,
} from "./session-exercise.schema";

// Um exercício adicionado no meio do treino raramente tem prescrição pensada; estes
// são os mesmos defaults que o editor de treino usa para exercício novo.
const DEFAULT_TARGET_SETS = 3;
const DEFAULT_TARGET_REPS = 10;

const SESSION_EXERCISE_INCLUDE = { exercise: true } as const;

/**
 * Só sessão ABERTA aceita mudança de plano. Uma sessão concluída é registro do que
 * aconteceu — editar o plano dela depois recriaria, em escala menor, o mesmo problema
 * que o snapshot existe para resolver.
 */
const loadOpenSession = async (userId: number, workoutSessionId: number) => {
    const session = await prisma.workoutSession.findUnique({ where: { id: workoutSessionId } });

    ensureOwnership(session, userId, "This workout session does not belong to the user");

    if (session!.completedAt !== null) {
        throw new AppError("Cannot change the plan of a completed workout session", 400);
    }

    return session!;
};

const loadEntry = async (userId: number, workoutSessionId: number, sessionExerciseId: number) => {
    await loadOpenSession(userId, workoutSessionId);

    const entry = await prisma.sessionExercise.findUnique({ where: { id: sessionExerciseId } });

    if (!entry || entry.workoutSessionId !== workoutSessionId) {
        throw new AppError("Session exercise not found in this session", 404);
    }

    return entry;
};

const nextOrderIndex = async (workoutSessionId: number) => {
    const last = await prisma.sessionExercise.findFirst({
        where: { workoutSessionId },
        orderBy: { orderIndex: "desc" },
        select: { orderIndex: true },
    });

    return (last?.orderIndex ?? 0) + 1;
};

const list = async (userId: number, workoutSessionId: number) => {
    const session = await prisma.workoutSession.findUnique({ where: { id: workoutSessionId } });

    ensureOwnership(session, userId, "This workout session does not belong to the user");

    return prisma.sessionExercise.findMany({
        where: { workoutSessionId },
        orderBy: { orderIndex: "asc" },
        include: SESSION_EXERCISE_INCLUDE,
    });
};

/** Exercício adicionado durante a sessão, fora do plano. */
const add = async (userId: number, workoutSessionId: number, data: AddSessionExerciseInput) => {
    await loadOpenSession(userId, workoutSessionId);

    const exercise = await prisma.exercise.findUnique({ where: { id: data.exerciseId } });
    if (!exercise) throw new AppError("Exercise not found", 404);

    return prisma.sessionExercise.create({
        data: {
            workoutSessionId,
            exerciseId:  data.exerciseId,
            orderIndex:  await nextOrderIndex(workoutSessionId),
            targetSets:  data.targetSets ?? DEFAULT_TARGET_SETS,
            targetReps:  data.targetReps ?? DEFAULT_TARGET_REPS,
            observation: data.observation ?? null,
            origin:      "AD_HOC",
        },
        include: SESSION_EXERCISE_INCLUDE,
    });
};

/**
 * Troca um exercício por outro, dentro desta sessão.
 *
 * Duas decisões que valem explicação:
 *
 * 1. O substituído NÃO é apagado nem marcado `skipped`. Ele pode já ter séries
 *    registradas — e mesmo sem nenhuma, "eu tinha isto prescrito e troquei" é
 *    informação diferente de "eu pulei". A relação `substitutedForId` é o que liga
 *    os dois, e é o que a tela usa para mostrar um no lugar do outro.
 *
 * 2. O substituto entra no FIM da ordem, não na posição do original. Reordenar
 *    exigiria deslocar todos os `orderIndex` seguintes, e `@@unique([workoutSessionId,
 *    orderIndex])` é checado por statement — um `UPDATE ... SET orderIndex =
 *    orderIndex + 1` colide no meio do caminho. A ordem de exibição é problema da UI,
 *    que já tem o link para posicionar; a tabela fica sendo o registro append-only do
 *    que aconteceu na sessão, que é o que ela deve ser.
 */
const substitute = async (
    userId: number,
    workoutSessionId: number,
    sessionExerciseId: number,
    data: SubstituteSessionExerciseInput
) => {
    const original = await loadEntry(userId, workoutSessionId, sessionExerciseId);

    if (original.exerciseId === data.exerciseId) {
        throw new AppError("The substitute is the same exercise", 400);
    }

    const exercise = await prisma.exercise.findUnique({ where: { id: data.exerciseId } });
    if (!exercise) throw new AppError("Exercise not found", 404);

    const alreadySubstituted = await prisma.sessionExercise.findFirst({
        where: { workoutSessionId, substitutedForId: sessionExerciseId },
        select: { id: true },
    });

    if (alreadySubstituted) {
        throw new AppError("This exercise has already been substituted in this session", 409);
    }

    return prisma.sessionExercise.create({
        data: {
            workoutSessionId,
            exerciseId:       data.exerciseId,
            orderIndex:       await nextOrderIndex(workoutSessionId),
            // A prescrição é herdada: trocar o movimento não muda o volume planejado.
            targetSets:       original.targetSets,
            targetReps:       original.targetReps,
            observation:      original.observation,
            // `groupKey` NÃO é herdado, de propósito. O substituto vai para `max + 1`
            // e o grupo é definido por contiguidade — herdar a chave criaria um
            // membro solto no fim da lista, que é exatamente a chave órfã que
            // `normalizeExerciseGroups` existe para impedir. O original continua no
            // grupo: o snapshot registra o que foi PRESCRITO, e prescrito ele foi.
            origin:           "SUBSTITUTED",
            substitutedForId: original.id,
        },
        include: SESSION_EXERCISE_INCLUDE,
    });
};

/** Marca (ou desmarca) um exercício como deliberadamente pulado. */
const setSkipped = async (
    userId: number,
    workoutSessionId: number,
    sessionExerciseId: number,
    data: SkipSessionExerciseInput
) => {
    const entry = await loadEntry(userId, workoutSessionId, sessionExerciseId);

    if (data.skipped) {
        const sets = await prisma.sessionSet.count({ where: { sessionExerciseId: entry.id } });

        if (sets > 0) {
            throw new AppError("Cannot skip an exercise that already has recorded sets", 409);
        }
    }

    return prisma.sessionExercise.update({
        where: { id: entry.id },
        data:  { skipped: data.skipped },
        include: SESSION_EXERCISE_INCLUDE,
    });
};

/**
 * Desfaz uma adição ou uma troca. Exercício PRESCRIBED não é removível: ele é o
 * registro do que o plano mandava, e apagá-lo seria reescrever a história da sessão —
 * para não fazer, existe `skipped`.
 */
const remove = async (userId: number, workoutSessionId: number, sessionExerciseId: number) => {
    const entry = await loadEntry(userId, workoutSessionId, sessionExerciseId);

    if (entry.origin === "PRESCRIBED") {
        throw new AppError("A prescribed exercise cannot be removed. Mark it as skipped instead.", 409);
    }

    const sets = await prisma.sessionSet.count({ where: { sessionExerciseId: entry.id } });

    if (sets > 0) {
        throw new AppError("Cannot remove an exercise that already has recorded sets", 409);
    }

    return prisma.sessionExercise.delete({ where: { id: entry.id } });
};

export { list, add, substitute, setSkipped, remove };
