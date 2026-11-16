import type { Response } from "express";
import prisma from "@plato/database";
import { loadJamState } from "./jam.state";

/**
 * Conexões SSE abertas, por jam. Em memória porque a `plato-api` roda em um processo só no
 * PM2; se um dia virar cluster, isto passa a ouvir `LISTEN/NOTIFY` do Postgres e o cliente
 * não muda.
 */
const streams = new Map<number, Set<Response>>();
const pending = new Map<number, NodeJS.Timeout>();

/** Várias mudanças em sequência (série + presença) viram um evento só. */
const PUBLISH_DEBOUNCE_MS = 120;
/** A Cloudflare derruba conexão ociosa em 100 s. */
const HEARTBEAT_MS = 25_000;

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

/** Manda o estado novo a todos que estão olhando esta jam. Nunca lança. */
export const publishJam = (jamId: number) => {
    if (!streams.has(jamId)) return;

    clearTimeout(pending.get(jamId));

    pending.set(jamId, setTimeout(async () => {
        pending.delete(jamId);

        try {
            const state = await loadJamState(jamId);
            const connections = streams.get(jamId);

            if (!state || !connections) return;

            for (const res of connections) sendJamState(res, state);
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
