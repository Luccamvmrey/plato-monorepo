/**
 * A matemática de treino agora mora em `@plato/shared`, para que backend e frontend
 * usem exatamente a mesma implementação — antes havia seis cálculos de volume
 * divergentes, e só os do frontend somavam o peso da barra.
 *
 * Este arquivo permanece como reexport para não quebrar os pontos de importação
 * existentes (`useExerciseAnalytics`, `useWorkoutSummaryStats`, `useSessionHistoryCardLogic`).
 */
export {
    calculateE1RM,
    calculateSetVolume,
    calculateTotalVolume,
    calculateAverageRPE,
    calculateSessionDuration,
    calculateSessionSummary,
    externalLoad,
    setVolume,
} from "@plato/shared";
