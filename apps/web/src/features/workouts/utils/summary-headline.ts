import type { TrackingMode } from "@/features/workouts/workout.types.ts";
import type { SummaryStats } from "@/features/workouts/hooks/useWorkoutSummaryStats";
import { formatDurationExtensive } from "@/core/utils/time";
import { UNITS } from "@/core/constants/units";

export type SummaryLead = {
    label: string;
    value: string;
    deltaPercent: number | null;
};

export type SummaryMetric = { label: string; value: string };

/**
 * O número principal do resumo. A tela e a imagem de compartilhar usam o mesmo, para a
 * imagem nunca contar uma história diferente da tela.
 *
 * No modo simplificado as reps são presumidas, e sem peso nenhum informado não há volume a
 * mostrar: "0 kg" diria que a pessoa não levantou nada.
 */
export const buildSummaryLead = (stats: SummaryStats, trackingMode: TrackingMode): SummaryLead | undefined => {
    if (stats.totalVolume <= 0) return undefined;

    const isSimple = trackingMode === "SIMPLE";

    return {
        label: isSimple ? "Volume estimado" : "Volume total",
        value: `${Math.round(stats.totalVolume).toLocaleString("pt-BR")} ${UNITS.WEIGHT}`,
        deltaPercent: isSimple ? null : stats.volumeDeltaPercent,
    };
};

export const buildSummaryMetrics = (stats: SummaryStats): SummaryMetric[] => [
    { label: "Duração", value: formatDurationExtensive(stats.duration) },
    { label: "Sets", value: String(stats.totalSets) },
    { label: "Exercícios", value: String(stats.completedExercises.length) },
];
