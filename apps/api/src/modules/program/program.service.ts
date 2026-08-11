import prisma from "@plato/database";
import { AppError } from "../../shared/error/AppError";
import { ensureOwnership } from "../../shared/utils/auth";
import { CreateProgramInput, UpdateProgramInput } from "./program.schema";

const PROGRAM_INCLUDE = {
    programWorkout: {
        orderBy: { orderIndex: "asc" },
        include: { workout: true },
    },
} as const;

/**
 * O catálogo de treinos é por usuário, mas nada impede um cliente de mandar o id de
 * um treino alheio no array. Sem esta checagem o programa viraria um caminho lateral
 * para ler o nome dos treinos de outra pessoa.
 */
const assertWorkoutsBelongToUser = async (userId: number, ids: number[]) => {
    const owned = await prisma.workout.count({ where: { id: { in: ids }, userId } });

    if (owned !== ids.length) {
        throw new AppError("One or more workouts do not belong to the user", 403);
    }
};

const assertOwnership = async (userId: number, programId: number) => {
    const program = await prisma.program.findUnique({ where: { id: programId } });

    ensureOwnership(program, userId, "This program does not belong to the user");

    return program;
};

const create = async (userId: number, data: CreateProgramInput) => {
    await assertWorkoutsBelongToUser(userId, data.workoutIds);

    return prisma.program.create({
        data: {
            name: data.name,
            description: data.description ?? null,
            user: { connect: { id: userId } },
            programWorkout: {
                create: data.workoutIds.map((workoutId, index) => ({ workoutId, orderIndex: index + 1 })),
            },
        },
        include: PROGRAM_INCLUDE,
    });
};

const getByUserId = async (userId: number) => {
    return prisma.program.findMany({
        where: { userId },
        orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
        include: PROGRAM_INCLUDE,
    });
};

const getById = async (userId: number, programId: number) => {
    const program = await prisma.program.findUnique({
        where: { id: programId },
        include: PROGRAM_INCLUDE,
    });

    ensureOwnership(program, userId, "This program does not belong to the user");

    return program;
};

/**
 * Substituição completa da lista, no mesmo padrão de `workout.service.update`.
 * O delete precisa acontecer antes do create dentro da transação: `@@unique([programId,
 * orderIndex])` é checado por statement, então reordenar sem limpar antes colide.
 */
const update = async (userId: number, programId: number, data: UpdateProgramInput) => {
    await assertOwnership(userId, programId);
    await assertWorkoutsBelongToUser(userId, data.workoutIds);

    return prisma.$transaction(async (tx) => {
        await tx.programWorkout.deleteMany({ where: { programId } });

        await tx.program.update({
            where: { id: programId },
            data: {
                ...(data.name !== undefined ? { name: data.name } : {}),
                ...(data.description !== undefined ? { description: data.description } : {}),
            },
        });

        await tx.programWorkout.createMany({
            data: data.workoutIds.map((workoutId, index) => ({ programId, workoutId, orderIndex: index + 1 })),
        });

        return tx.program.findUniqueOrThrow({ where: { id: programId }, include: PROGRAM_INCLUDE });
    });
};

/**
 * Desativar os outros ANTES de ativar este não é estilo: o índice único parcial
 * `program_one_active_per_user` é verificado a cada statement, então a ordem inversa
 * estoura no meio da transação.
 */
const activate = async (userId: number, programId: number) => {
    await assertOwnership(userId, programId);

    return prisma.$transaction(async (tx) => {
        await tx.program.updateMany({
            where: { userId, isActive: true, id: { not: programId } },
            data: { isActive: false },
        });

        return tx.program.update({
            where: { id: programId },
            data: { isActive: true },
            include: PROGRAM_INCLUDE,
        });
    });
};

const deactivate = async (userId: number, programId: number) => {
    await assertOwnership(userId, programId);

    return prisma.program.update({
        where: { id: programId },
        data: { isActive: false },
        include: PROGRAM_INCLUDE,
    });
};

const remove = async (userId: number, programId: number) => {
    await assertOwnership(userId, programId);

    // ProgramWorkout cai por cascade; WorkoutSession.programId vira null (SetNull).
    // Nenhuma sessão é apagada — o histórico não pertence ao programa.
    return prisma.program.delete({ where: { id: programId } });
};

/**
 * O treino sugerido do programa ativo.
 *
 * Deliberadamente DERIVADO, não guardado: "próximo = sucessor, na ordem do programa,
 * do último treino do programa concluído". Um ponteiro `currentIndex` no banco
 * dessincroniza quando uma sessão é deletada, quando o usuário treina fora de ordem
 * ou quando dois dispositivos escrevem — a derivação é idempotente e se auto-corrige.
 *
 * Testado contra o histórico real do usuário 1 antes de ser escolhido: acerta 10 de 11
 * transições do bloco atual. E a sugestão nunca bloqueia nada — o usuário inicia o
 * treino que quiser, e o cálculo simplesmente reflete o que ele fez.
 */
const getActiveWithNext = async (userId: number) => {
    const program = await prisma.program.findFirst({
        where: { userId, isActive: true },
        include: PROGRAM_INCLUDE,
    });

    if (!program) return null;

    const entries = program.programWorkout;

    if (entries.length === 0) {
        return { program, next: null, position: null, total: 0, lastCompleted: null, cycle: [] };
    }

    const workoutIds = entries.map((entry) => entry.workoutId);

    // Só sessões CONCLUÍDAS movem o ponteiro. Existe hoje sessão aberta e abandonada
    // há um mês no banco; contá-la congelaria a sugestão nela.
    //
    // O filtro por `programId` é o que faz sessão avulsa ser IGNORADA em vez de
    // resetar o ciclo, e o `in: workoutIds` cobre o treino removido do programa no
    // meio do caminho — sem ele, o ponteiro ficaria preso num treino que não existe
    // mais na rotação.
    const lastSession = await prisma.workoutSession.findFirst({
        where: {
            userId,
            programId: program.id,
            completedAt: { not: null },
            workoutId: { in: workoutIds },
        },
        orderBy: { completedAt: "desc" },
        select: { id: true, workoutId: true, completedAt: true },
    });

    // Última execução de cada treino do ciclo, para a UI mostrar "há N dias".
    // De propósito NÃO filtra por programId: a pergunta é "quando foi a última vez que
    // fiz este treino", e uma sessão avulsa do mesmo treino conta para essa resposta.
    const lastByWorkout = await prisma.workoutSession.groupBy({
        by: ["workoutId"],
        where: { userId, completedAt: { not: null }, workoutId: { in: workoutIds } },
        _max: { completedAt: true },
    });

    const lastCompletedByWorkout = new Map<number, Date | null>(
        lastByWorkout.map((row) => [row.workoutId, row._max.completedAt])
    );

    const lastIndex = lastSession
        ? entries.findIndex((entry) => entry.workoutId === lastSession.workoutId)
        : -1;

    // Sem sessão anterior, a sugestão é a primeira posição do ciclo.
    const nextIndex = lastIndex === -1 ? 0 : (lastIndex + 1) % entries.length;

    return {
        program: {
            id: program.id,
            name: program.name,
            description: program.description,
            isActive: program.isActive,
        },
        next: entries[nextIndex],
        position: nextIndex + 1,
        total: entries.length,
        lastCompleted: lastSession
            ? {
                sessionId: lastSession.id,
                workoutId: lastSession.workoutId,
                completedAt: lastSession.completedAt,
            }
            : null,
        cycle: entries.map((entry, index) => ({
            workoutId: entry.workoutId,
            name: entry.workout.name,
            position: index + 1,
            isNext: index === nextIndex,
            lastCompletedAt: lastCompletedByWorkout.get(entry.workoutId) ?? null,
        })),
    };
};

/**
 * O programa ativo ao qual um treino pertence, se houver. Usado por
 * `workoutSession.create` para carimbar a sessão sem exigir nada do cliente.
 */
const findActiveProgramIdForWorkout = async (userId: number, workoutId: number) => {
    const entry = await prisma.programWorkout.findFirst({
        where: { workoutId, program: { userId, isActive: true } },
        select: { programId: true },
    });

    return entry?.programId ?? null;
};

export {
    create,
    getByUserId,
    getById,
    update,
    activate,
    deactivate,
    remove,
    getActiveWithNext,
    findActiveProgramIdForWorkout,
};
