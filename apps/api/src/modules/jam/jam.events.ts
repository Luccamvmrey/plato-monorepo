import type { Response } from "express";
import prisma from "@plato/database";
import { jamExerciseMode, jamTurnForExercise, type JamState } from "@plato/shared";
import { sendPushToUser } from "../../shared/push/push";
import { loadJamState } from "./jam.state";

/**
 * Conexões SSE abertas, por jam. Em memória porque a `plato-api` roda em um processo só no
 * PM2; se um dia virar cluster, isto passa a ouvir `LISTEN/NOTIFY` do Postgres e o cliente
 * não muda.
 */
const streams = new Map<number, Set<Response>>();
const pending = new Map<number, NodeJS.Timeout>();
/** Última vez vista por exercício em revezamento, para saber quando ela muda de mãos. */
const lastTurns = new Map<number, Map<number, number | null>>();

/** Várias mudanças em sequência (série + presença) viram um evento só. */
const PUBLISH_DEBOUNCE_MS = 120;
/** A Cloudflare derruba conexão ociosa em 100 s. */
const HEARTBEAT_MS = 25_000;
/** "Sua vez" de dois minutos atrás já passou: o serviço de push pode descartar. */
const TURN_PUSH_TTL_SECONDS = 120;

const write = (res: Response, chunk: string) => {
    try {
        res.write(chunk);
    } catch (error) {
        console.error("Failed to write jam event", error);
    }
};

setInterval(() => {
    for (const connections of streams.values()) {
        for (const res of connections) write(res, ": ping\n\n");
    }
}, HEARTBEAT_MS).unref();

/** Registra a conexão e devolve a função que a remove. */
export const subscribeJam = (jamId: number, res: Response) => {
    const connections = streams.get(jamId) ?? new Set<Response>();
    connections.add(res);
    streams.set(jamId, connections);

    return () => {
        connections.delete(res);
        if (connections.size === 0) streams.delete(jamId);
    };
};

export const sendJamState = (res: Response, state: unknown) => write(res, `data: ${JSON.stringify(state)}\n\n`);

/** Push para quem acabou de ganhar a vez. Sem rede ou sem chaves VAPID, só registra. */
const sendTurnPush = async (state: JamState, userId: number, exerciseId: number, previousUserId: number | null) => {
    const member = state.members.find((candidate) => candidate.userId === userId);
    const previous = state.members.find((candidate) => candidate.userId === previousUserId);

    if (!member?.session) return;

    const session = await prisma.workoutSession.findUnique({
        where: { id: member.session.id },
        select: { workoutId: true },
    });

    if (!session) return;

    const exerciseName = member.session.exercises.find((exercise) => exercise.exerciseId === exerciseId)?.name ?? "Revezamento";

    await sendPushToUser(
        userId,
        {
            title: "Sua vez",
            body: previous ? `${exerciseName}: ${previous.name} terminou a série.` : `${exerciseName}: o aparelho é seu.`,
            url: `/active-workout/${session.workoutId}`,
            tag: `jam-turn-${state.id}`,
            quietWhenVisible: true,
        },
        { ttlSeconds: TURN_PUSH_TTL_SECONDS, urgency: "high" }
    );
};

/**
 * Compara a vez de cada exercício em revezamento com a última vista e avisa quem ganhou a
 * vez. A primeira leitura depois de o servidor subir só registra: sem a anterior, não dá
 * para saber se a vez mudou agora.
 */
const notifyTurnChanges = (state: JamState) => {
    if (state.endedAt) {
        lastTurns.delete(state.id);
        return;
    }

    const known = lastTurns.get(state.id) ?? new Map<number, number | null>();
    lastTurns.set(state.id, known);

    for (const key of Object.keys(state.exerciseModes)) {
        const exerciseId = Number(key);
        if (jamExerciseMode(state.exerciseModes, exerciseId) !== "ALTERNATE") continue;

        const turn = jamTurnForExercise(state, exerciseId);
        const hadPrevious = known.has(exerciseId);
        const previous = known.get(exerciseId) ?? null;
        known.set(exerciseId, turn);

        if (!hadPrevious || turn === null || turn === previous) continue;

        sendTurnPush(state, turn, exerciseId, previous)
            .catch((error: unknown) => console.error(`Failed to send jam ${state.id} turn push`, error));
    }
};

/**
 * Manda o estado novo a todos que estão olhando esta jam e avisa por push quem ganhou a vez.
 * Roda mesmo sem ninguém conectado: com a tela apagada o stream cai, e é aí que o push
 * importa. Nunca lança.
 */
export const publishJam = (jamId: number) => {
    clearTimeout(pending.get(jamId));

    pending.set(jamId, setTimeout(async () => {
        pending.delete(jamId);

        try {
            const state = await loadJamState(jamId);
            if (!state) return;

            for (const res of streams.get(jamId) ?? []) sendJamState(res, state);

            notifyTurnChanges(state);
        } catch (error) {
            console.error(`Failed to publish jam ${jamId}`, error);
        }
    }, PUBLISH_DEBOUNCE_MS));
};

/**
 * A jam acaba sozinha quando ninguém que ainda está nela tem treino aberto. Cobre também o
 * abandono: o fechamento automático conclui a sessão de quem esqueceu, e a jam fecha junto.
 */
const endJamIfNobodyTraining = async (jamId: number) => {
    const jam = await prisma.jam.findUnique({
        where: { id: jamId },
        select: {
            endedAt: true,
            members: { where: { leftAt: null }, select: { userId: true } },
            sessions: { where: { completedAt: null }, select: { userId: true } },
        },
    });

    if (!jam || jam.endedAt) return;

    const active = new Set(jam.members.map((member) => member.userId));
    const someoneTraining = jam.sessions.some((session) => active.has(session.userId));

    if (!someoneTraining) {
        await prisma.jam.updateMany({ where: { id: jamId, endedAt: null }, data: { endedAt: new Date() } });
    }
};

/**
 * Chamado pelo módulo de sessão quando a sessão de alguém da jam muda (série, conclusão,
 * cancelamento). Não espera nem lança: a jam nunca pode atrapalhar o treino.
 */
export const notifyJamSessionChanged = (jamId: number | null | undefined) => {
    if (!jamId) return;

    endJamIfNobodyTraining(jamId)
        .catch((error: unknown) => console.error(`Failed to check jam ${jamId} end`, error))
        .finally(() => publishJam(jamId));
};
