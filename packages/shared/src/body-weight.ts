/** Um registro de peso corporal. As datas chegam como Date (Prisma) ou string (JSON). */
export interface BodyWeightEntry {
    weight: number;
    measuredAt: Date | string;
}

const toTime = (value: Date | string): number => new Date(value).getTime();

/**
 * Peso corporal vigente numa data.
 *
 * Regra, nesta ordem:
 *   1. o registro mais recente com `measuredAt <= date`
 *   2. se não houver nenhum anterior, o mais próximo posterior
 *   3. se não houver registro nenhum, `null`
 *
 * O passo 3 devolve `null` de propósito: sem peso registrado a carga efetiva de um
 * exercício de peso corporal é INDEFINIDA, e inventar um valor produziria PR e
 * progressão silenciosamente errados. Quem consome trata o null e a UI sinaliza.
 *
 * Nota sobre a data de uma série: `SessionSet` não tem timestamp no schema, então a
 * data de uma série é a da sessão — `completedAt ?? startedAt`.
 */
export const resolveBodyWeightAt = (
    logs: readonly BodyWeightEntry[],
    date: Date | string | null | undefined
): number | null => {
    if (logs.length === 0 || date == null) return null;

    const target = toTime(date);
    if (Number.isNaN(target)) return null;

    let previous: BodyWeightEntry | null = null;
    let next: BodyWeightEntry | null = null;

    for (const log of logs) {
        const time = toTime(log.measuredAt);
        if (Number.isNaN(time)) continue;

        if (time <= target) {
            if (previous === null || time > toTime(previous.measuredAt)) previous = log;
        } else {
            if (next === null || time < toTime(next.measuredAt)) next = log;
        }
    }

    return previous?.weight ?? next?.weight ?? null;
};
