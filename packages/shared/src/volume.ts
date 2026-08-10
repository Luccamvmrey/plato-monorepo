import type { VolumeSet } from "./types";

/**
 * Componente externo da carga de uma série: o que está na barra mais a própria
 * barra. Este é o único lugar que decide que `equipmentWeight` SOMA.
 *
 * Cuidado com `0`: peso corporal e máquina assistida registram `actualWeight: 0`
 * legitimamente, então nada aqui pode usar guarda de truthiness.
 */
export const externalLoad = (set: VolumeSet): number =>
    set.actualWeight + (set.equipmentWeight ?? 0);

/** Volume (tonelagem) de uma série. */
export const calculateSetVolume = (
    weight: number,
    reps: number,
    equipmentWeight: number = 0
): number => (weight + equipmentWeight) * reps;

/** Volume de uma série a partir do próprio objeto. */
export const setVolume = (set: VolumeSet): number =>
    externalLoad(set) * set.actualReps;

/** Volume total de um conjunto de séries. */
export const calculateTotalVolume = (sets: readonly VolumeSet[]): number =>
    sets.reduce((total, set) => total + setVolume(set), 0);
