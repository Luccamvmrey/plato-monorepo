import { randomBytes } from "crypto";
import prisma, { Prisma } from "@plato/database";
import { JAM_MAX_MEMBERS, isShareToken, pickJamEntryExercise } from "@plato/shared";
import { AppError } from "../../shared/error/AppError";
import { ensureOwnership } from "../../shared/utils/auth";
import { sendPushToUser } from "../../shared/push/push";
import { toSnapshotWorkout } from "../share/share.service";
import { toWorkoutExerciseRows } from "../workout/workout.service";
import * as workoutSessionService from "../workout-session/workout-session.service";
import { notifyJamSessionChanged, publishJam } from "./jam.events";
import { loadJamState, parseModes, parsePresence } from "./jam.state";
import type { JamModeInput, JamPresenceInput, JoinJamInput } from "./jam.schema";

/** Mesma resposta para token inexistente e malformado: não confirma que a jam existiu. */
const notFound = () => new AppError("This jam is not available", 404);

/** Sessão aberta de outro treino. O cliente oferece concluir ou descartar antes de entrar. */
const openSessionError = () => new AppError("You have an open workout session", 409);

/** Um treino próprio vale como "o mesmo do host" quando cobre ao menos metade dos exercícios. */
const MIN_CANDIDATE_OVERLAP = 0.5;

const firstName = (name: string | null) => name?.trim().split(/\s+/)[0] || "Alguém";

const normalizeName = (name: string) => name.trim().toLocaleLowerCase("pt-BR");

const findByToken = async (token: string) => {
    if (!isShareToken(token)) throw notFound();

    const jam = await prisma.jam.findUnique({
        where: { token },
        select: {
            id: true,
            hostUserId: true,
            hostWorkoutId: true,
            endedAt: true,
            hostWorkout: { select: { sourcePlanId: true } },
            sharedPlan: {
                select: {
                    id: true,
                    name: true,
                    workouts: {
                        orderBy: { orderIndex: "asc" },
                        take: 1,
                        include: { exercises: { orderBy: { orderIndex: "asc" } } },
                    },
                },
            },
            members: { orderBy: { joinedAt: "asc" }, select: { userId: true, leftAt: true, presence: true } },
        },
    });

    if (!jam) throw notFound();

    return jam;
};

type JamByToken = Awaited<ReturnType<typeof findByToken>>;

const planExercisesOf = (jam: JamByToken) => jam.sharedPlan.workouts[0]?.exercises ?? [];

/** Só quem está (ou esteve) na jam enxerga o estado dela. Para o resto, ela não existe. */
const findMembership = async (userId: number, jamId: number) => {
    const member = await prisma.jamMember.findUnique({
        where: { jamId_userId: { jamId, userId } },
        select: { leftAt: true, jam: { select: { endedAt: true, hostUserId: true } } },
    });

    if (!member) throw notFound();

    return member;
};

/** Para quem quer mudar algo: precisa estar na jam e a jam precisa estar aberta. */
const requireActiveMember = async (userId: number, jamId: number) => {
    const member = await findMembership(userId, jamId);

    if (member.leftAt) throw new AppError("You are not in this jam", 403);
    if (member.jam.endedAt) throw new AppError("This jam has ended", 409);

    return member;
};

const hasOpenSession = async (userId: number) =>
    (await prisma.workoutSession.count({ where: { userId, completedAt: null } })) > 0;

const create = async (userId: number, workoutId: number) => {
    const workout = await prisma.workout.findUnique({
        where: { id: workoutId },
        include: { workoutExercise: true },
    });

    ensureOwnership(workout, userId, "This workout does not belong to the user");

    if (await hasOpenSession(userId)) throw openSessionError();

    const jam = await prisma.$transaction(async (tx) => {
        const plan = await tx.sharedPlan.create({
            data: {
                token: randomBytes(16).toString("base64url"),
                kind: "WORKOUT",
                name: workout!.name,
                description: workout!.description,
                userId,
                workouts: { create: [toSnapshotWorkout(workout!, 0)] },
            },
            select: { id: true },
        });

        return tx.jam.create({
            data: {
                token: randomBytes(16).toString("base64url"),
                hostUserId: userId,
                sharedPlanId: plan.id,
                hostWorkoutId: workout!.id,
                members: { create: { userId } },
            },
            select: { id: true, token: true, sharedPlanId: true },
        });
    });

    try {
        const { newSession } = await workoutSessionService.create(userId, { workoutId, jamId: jam.id });

        return { jamId: jam.id, token: jam.token, sessionId: newSession.id, workoutId };
    } catch (error) {
        // Sem a sessão do host a jam não serve para nada. Apagar o plano leva a jam junto.
        await prisma.sharedPlan.delete({ where: { id: jam.sharedPlanId } }).catch(() => undefined);
        throw error;
    }
};

/** O que a tela de entrada mostra antes do login. Nada de carga nem de quem é cada um. */
const getPreview = async (token: string) => {
    const jam = await findByToken(token);
    const host = await prisma.user.findUnique({ where: { id: jam.hostUserId }, select: { name: true } });
    const activeMembers = jam.members.filter((member) => member.leftAt === null).length;

    return {
        workoutName: jam.sharedPlan.name,
        exerciseCount: planExercisesOf(jam).length,
        hostName: firstName(host?.name ?? null),
        memberCount: activeMembers,
        maxMembers: JAM_MAX_MEMBERS,
        isFull: activeMembers >= JAM_MAX_MEMBERS,
        isEnded: jam.endedAt !== null,
    };
};

/**
 * Treinos de quem entra que já são "o mesmo do host": copiados do mesmo link, de um link do
 * próprio host ou de uma jam anterior com o mesmo treino. Usar o próprio mantém o histórico
 * num treino só e conta no programa ativo. Do mais provável para o menos.
 */
const findCandidates = async (userId: number, jam: JamByToken) => {
    if (userId === jam.hostUserId) return [];

    const sourcePlanId = jam.hostWorkout?.sourcePlanId ?? null;
    const origins: Prisma.WorkoutWhereInput[] = [
        { sourcePlan: { userId: jam.hostUserId, jam: { is: null } } },
        ...(sourcePlanId !== null ? [{ sourcePlanId }] : []),
        ...(jam.hostWorkoutId !== null ? [{ sourcePlan: { jam: { is: { hostWorkoutId: jam.hostWorkoutId } } } }] : []),
    ];

    const workouts = await prisma.workout.findMany({
        where: { userId, OR: origins },
        select: { id: true, name: true, isActive: true, workoutExercise: { select: { exerciseId: true } } },
    });

    const planExerciseIds = new Set(planExercisesOf(jam).map((exercise) => exercise.exerciseId));
    const hostName = normalizeName(jam.sharedPlan.name);

    return workouts
        .map((workout) => {
            const own = new Set(workout.workoutExercise.map((exercise) => exercise.exerciseId));
            const shared = [...planExerciseIds].filter((exerciseId) => own.has(exerciseId)).length;

            return {
                id: workout.id,
                name: workout.name,
                isActive: workout.isActive,
                sameName: normalizeName(workout.name) === hostName,
                overlap: planExerciseIds.size === 0 ? 0 : shared / planExerciseIds.size,
            };
        })
        .filter((candidate) => candidate.overlap >= MIN_CANDIDATE_OVERLAP)
        .sort((a, b) =>
            Number(b.sameName) - Number(a.sameName) ||
            b.overlap - a.overlap ||
            Number(b.isActive) - Number(a.isActive) ||
            b.id - a.id
        )
        .map(({ id, name, isActive }) => ({ id, name, isActive }));
};

const getCandidates = async (userId: number, token: string) => findCandidates(userId, await findByToken(token));

/** Cópia do treino do host, arquivada para não poluir a lista. O resumo oferece guardá-la. */
const copyHostWorkout = async (userId: number, jam: JamByToken) => {
    const planWorkout = jam.sharedPlan.workouts[0];

    if (!planWorkout) throw new AppError("This jam has no workout", 409);

    const copy = await prisma.workout.create({
        data: {
            name: planWorkout.name,
            description: planWorkout.description,
            isActive: false,
            sourcePlan: { connect: { id: jam.sharedPlan.id } },
            user: { connect: { id: userId } },
            workoutExercise: {
                create: toWorkoutExerciseRows(planWorkout.exercises.map((exercise) => ({
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

    return copy.id;
};

const join = async (userId: number, token: string, { workoutId }: JoinJamInput) => {
    const jam = await findByToken(token);

    if (jam.endedAt) throw new AppError("This jam has ended", 409);

    const membership = jam.members.find((member) => member.userId === userId);
    const openSession = await prisma.workoutSession.findFirst({
        where: { userId, completedAt: null },
        select: { id: true, jamId: true, workoutId: true },
    });

    // Já está na jam com o treino aberto (toque duplo, QR lido de novo, voltou depois de
    // sair): só volta, sem sessão nova.
    if (membership && openSession?.jamId === jam.id) {
        if (membership.leftAt) {
            await prisma.jamMember.update({
                where: { jamId_userId: { jamId: jam.id, userId } },
                data: { leftAt: null },
            });
            publishJam(jam.id);
        }

        return { jamId: jam.id, sessionId: openSession.id, workoutId: openSession.workoutId, entryExerciseId: null };
    }

    const activeMembers = jam.members.filter((member) => member.leftAt === null && member.userId !== userId);
    if (activeMembers.length >= JAM_MAX_MEMBERS) throw new AppError("This jam is full", 409);

    if (openSession) throw openSessionError();

    let sessionWorkoutId: number;

    if (workoutId !== undefined) {
        const candidates = await findCandidates(userId, jam);

        if (!candidates.some((candidate) => candidate.id === workoutId)) {
            throw new AppError("This workout cannot be used in this jam", 400);
        }

        sessionWorkoutId = workoutId;
    } else {
        sessionWorkoutId = await copyHostWorkout(userId, jam);
    }

    // Quem volta depois de ter saído vai para o fim da fila do revezamento.
    await prisma.jamMember.upsert({
        where: { jamId_userId: { jamId: jam.id, userId } },
        create: { jamId: jam.id, userId },
        update: { leftAt: null, joinedAt: new Date(), presence: Prisma.DbNull },
    });

    const { newSession } = await workoutSessionService.create(userId, { workoutId: sessionWorkoutId, jamId: jam.id });

    const ownExercises = await prisma.sessionExercise.findMany({
        where: { workoutSessionId: newSession.id },
        select: { exerciseId: true },
    });

    const entryExerciseId = pickJamEntryExercise(
        activeMembers.map((member) => ({
            exerciseId: parsePresence(member.presence)?.exerciseId ?? null,
            isHost: member.userId === jam.hostUserId,
        })),
        ownExercises.map((exercise) => exercise.exerciseId)
    );

    await prisma.jamMember.update({
        where: { jamId_userId: { jamId: jam.id, userId } },
        data: { presence: { exerciseId: entryExerciseId, restEndsAt: null } },
    });

    publishJam(jam.id);

    notifyHostOfJoin(jam.id, jam.hostUserId, userId)
        .catch((error: unknown) => console.error(`Failed to notify jam ${jam.id} host`, error));

    return { jamId: jam.id, sessionId: newSession.id, workoutId: sessionWorkoutId, entryExerciseId };
};

/** Avisa o host que alguém entrou, com o link de volta para o treino dele. Nunca lança. */
const notifyHostOfJoin = async (jamId: number, hostUserId: number, joinerId: number) => {
    const [joiner, hostSession] = await Promise.all([
        prisma.user.findUnique({ where: { id: joinerId }, select: { name: true } }),
        prisma.workoutSession.findFirst({
            where: { jamId, userId: hostUserId, completedAt: null },
            select: { workoutId: true },
        }),
    ]);

    if (!joiner || !hostSession) return;

    await sendPushToUser(hostUserId, {
        title: "Jam",
        body: `${firstName(joiner.name)} entrou na jam.`,
        url: `/active-workout/${hostSession.workoutId}`,
        tag: `jam-join-${jamId}`,
        quietWhenVisible: true,
    });
};

const getState = async (userId: number, jamId: number) => {
    await findMembership(userId, jamId);

    const state = await loadJamState(jamId);
    if (!state) throw notFound();

    return state;
};

const updatePresence = async (userId: number, jamId: number, presence: JamPresenceInput) => {
    await requireActiveMember(userId, jamId);

    await prisma.jamMember.update({
        where: { jamId_userId: { jamId, userId } },
        data: { presence },
    });

    publishJam(jamId);
};

const setExerciseMode = async (userId: number, jamId: number, exerciseId: number, { mode }: JamModeInput) => {
    await requireActiveMember(userId, jamId);

    const jam = await prisma.jam.findUniqueOrThrow({ where: { id: jamId }, select: { exerciseModes: true } });
    const modes = parseModes(jam.exerciseModes);

    // PARALLEL é o padrão: tirar a chave mantém o JSON só com o que foi mudado.
    if (mode === "PARALLEL") delete modes[String(exerciseId)];
    else modes[String(exerciseId)] = mode;

    await prisma.jam.update({ where: { id: jamId }, data: { exerciseModes: modes } });

    publishJam(jamId);
};

/** Sair não cancela o treino. Se era o host, o papel passa para quem entrou em seguida. */
const leave = async (userId: number, jamId: number) => {
    const member = await findMembership(userId, jamId);

    if (member.leftAt) return;

    await prisma.$transaction(async (tx) => {
        await tx.jamMember.update({
            where: { jamId_userId: { jamId, userId } },
            data: { leftAt: new Date(), presence: Prisma.DbNull },
        });

        if (member.jam.hostUserId !== userId || member.jam.endedAt) return;

        const next = await tx.jamMember.findFirst({
            where: { jamId, leftAt: null },
            orderBy: { joinedAt: "asc" },
            select: { userId: true },
        });

        await tx.jam.update({
            where: { id: jamId },
            data: next ? { hostUserId: next.userId } : { endedAt: new Date() },
        });
    });

    notifyJamSessionChanged(jamId);
};

const end = async (userId: number, jamId: number) => {
    const member = await findMembership(userId, jamId);

    if (member.jam.hostUserId !== userId) throw new AppError("Only the host can end the jam", 403);
    if (member.jam.endedAt) return;

    await prisma.jam.update({ where: { id: jamId }, data: { endedAt: new Date() } });

    publishJam(jamId);
};

export { create, getPreview, getCandidates, join, getState, findMembership, updatePresence, setExerciseMode, leave, end };
