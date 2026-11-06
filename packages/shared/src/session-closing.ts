/** Sem série nova por este tempo, a pessoa terminou e esqueceu de concluir. */
export const AUTO_CLOSE_AFTER_MS = 3 * 3_600_000;
/** Sem nenhuma série registrada: abriu o treino e não treinou. Só bloquearia o próximo. */
export const EMPTY_DISCARD_AFTER_MS = 24 * 3_600_000;

export type OpenSessionAction = "KEEP" | "CLOSE" | "DISCARD";

interface OpenSessionInput {
    startedAt: number;
    lastSetAt: number | null;
    /** Null quando o aparelho nunca enviou rascunho: as séries, se houver, estão só nele. */
    draftSetCount: number | null;
    now: number;
}

/** Sem rascunho nada acontece: fechar ou descartar essa sessão apagaria séries que só o aparelho tem. */
export const decideOpenSession = ({ startedAt, lastSetAt, draftSetCount, now }: OpenSessionInput): OpenSessionAction => {
    if (draftSetCount === null) return "KEEP";

    if (draftSetCount === 0) return now - startedAt >= EMPTY_DISCARD_AFTER_MS ? "DISCARD" : "KEEP";

    return now - (lastSetAt ?? startedAt) >= AUTO_CLOSE_AFTER_MS ? "CLOSE" : "KEEP";
};

/**
 * Rascunho vazio marca a sessão como acompanhada, o que permite descartá-la depois. Em sessão
 * antiga isso é perigoso: se este aparelho não tem séries, elas podem estar em outro. No iPhone,
 * por exemplo, o Safari e o app instalado não dividem armazenamento.
 */
export const shouldSendDraft = (setCount: number, startedAt: number, now: number): boolean =>
    setCount > 0 || now - startedAt < AUTO_CLOSE_AFTER_MS;

/** O horário vem do aparelho, que pode estar errado: fica sempre entre o início do treino e agora. */
export const normalizeLastSetAt = (lastSetAt: number | null | undefined, startedAt: number, now: number): number | null =>
    lastSetAt === null || lastSetAt === undefined ? null : Math.min(now, Math.max(startedAt, lastSetAt));

/**
 * Quem conclui muito depois da última série esqueceu: vale o horário em que treinou, senão
 * histórico, sequência e resumos caem no dia errado. Sem horário de série, vale o início.
 */
export const resolveCompletedAt = (startedAt: number, lastSetAt: number | null, now: number): number => {
    const lastActivity = lastSetAt ?? startedAt;

    return now - lastActivity >= AUTO_CLOSE_AFTER_MS ? lastActivity : now;
};
