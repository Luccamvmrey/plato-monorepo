import type { VolumeSet } from "./types";
import { externalLoad } from "./volume";

/**
 * Espelha o enum `LoadType` do Prisma como união de literais — `@plato/shared` não
 * depende de `@plato/database` de propósito, e o enum gerado é estruturalmente
 * compatível com esta união.
 */
export type LoadType = "EXTERNAL" | "BODYWEIGHT" | "BODYWEIGHT_LOADED" | "ASSISTED";

export type RepUnit = "REPS" | "SECONDS";

export interface LoadContext {
    loadType: LoadType;
    repUnit?: RepUnit;
}

/**
 * Carga efetiva de uma série, em kg — o que o corpo realmente moveu.
 *
 * `actualWeight` sozinho é ambíguo: numa máquina assistida um número MAIOR é um
 * exercício MAIS FÁCIL, e num agachamento é mais difícil. Sem esta função as duas
 * escalas convivem invertidas na mesma coluna, que é a causa raiz de todos os PRs
 * errados de exercício de peso corporal.
 *
 * Devolve `null` quando o cálculo depende do peso corporal e ele é desconhecido.
 * Quem consome deve pular a série, nunca substituir por 0.
 *
 * Consequência que simplifica o resto: para `ASSISTED` a carga efetiva já CRESCE
 * quando a assistência cai, então a comparação de recorde continua sendo `>` para
 * todos os tipos. Não existe ramo invertido em lugar nenhum.
 */
export const effectiveLoad = (
    set: VolumeSet,
    exercise: LoadContext,
    bodyWeight: number | null
): number | null => {
    const external = externalLoad(set);

    switch (exercise.loadType) {
        case "EXTERNAL":
            return external;

        case "BODYWEIGHT":
            return bodyWeight;

        case "BODYWEIGHT_LOADED":
            return bodyWeight === null ? null : bodyWeight + external;

        case "ASSISTED":
            return bodyWeight === null ? null : bodyWeight - external;
    }
};

/**
 * Volume efetivo de uma série: carga efetiva × repetições.
 *
 * Devolve `null` para exercício medido em segundos — carga × segundos não é volume
 * e somar isso a um total de tonelagem produz número sem significado.
 */
export const effectiveVolume = (
    set: VolumeSet & { actualReps: number },
    exercise: LoadContext,
    bodyWeight: number | null
): number | null => {
    if (exercise.repUnit === "SECONDS") return null;

    const load = effectiveLoad(set, exercise, bodyWeight);

    return load === null ? null : load * set.actualReps;
};
