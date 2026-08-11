import type { VolumeSet } from "./types";
import type { LoadContext } from "./effective-load";
import { effectiveLoad, effectiveVolume } from "./effective-load";

/** Série com o contexto de carga do exercício embutido, como vem do Prisma. */
export interface RecordCandidateSet extends VolumeSet {
    exerciseId: number;
    actualReps: number;
    excludedFromRecords?: boolean;
    exercise: LoadContext;
}

export interface ExerciseRecordStats {
    /** Maior carga efetiva da sessão. `null` quando nenhuma série é computável. */
    maxLoad: number | null;
    /** Volume efetivo somado da sessão para o exercício. */
    sessionVolume: number | null;
}

/**
 * Estatísticas de recorde de uma sessão, por exercício.
 *
 * Duas definições fixadas aqui, e são as mesmas nos dois lados da aplicação:
 *   - WEIGHT é a maior **carga efetiva**, não `actualWeight` cru.
 *   - VOLUME é o volume da SESSÃO por exercício (soma das séries), não o da série
 *     isolada — que na prática era só a série mais pesada vezes as reps dela.
 *
 * Séries excluídas e séries com carga indefinida (peso corporal desconhecido na
 * data) ficam de fora. Nunca viram 0: um 0 entraria no `Math.max` e no somatório
 * como se fosse um dado real.
 */
export const summarizeSessionRecords = (
    sets: readonly RecordCandidateSet[],
    bodyWeight: number | null
): Record<number, ExerciseRecordStats> => {
    const stats: Record<number, ExerciseRecordStats> = {};

    for (const set of sets) {
        if (set.excludedFromRecords) continue;

        if (!stats[set.exerciseId]) {
            stats[set.exerciseId] = { maxLoad: null, sessionVolume: null };
        }
        const current = stats[set.exerciseId];

        const load = effectiveLoad(set, set.exercise, bodyWeight);
        if (load !== null && (current.maxLoad === null || load > current.maxLoad)) {
            current.maxLoad = load;
        }

        const volume = effectiveVolume(set, set.exercise, bodyWeight);
        if (volume !== null) {
            current.sessionVolume = (current.sessionVolume ?? 0) + volume;
        }
    }

    return stats;
};
