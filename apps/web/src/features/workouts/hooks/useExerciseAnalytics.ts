import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { WorkoutSessionService } from "@/features/workouts/services/workout-session/workout-session.service";
import { PersonalRecordService } from "@/features/workouts/services/personal-record.service";
import { calculateE1RM, calculateSetVolume, externalLoad } from "@/features/workouts/utils/analytics";
import { path } from "@/core/constants/path";
import type { SessionSet } from "@/features/workouts/workout.types";

export type AnalyticsMetric = "strength" | "load" | "volume";

export interface ChartPoint {
    date: Date;
    value: number;
}

export interface ExerciseExecutionRow {
    id: number;
    date: Date;
    isSimple: boolean;
    setCount: number;
    /** Maior carga da sessão. `null` quando nenhuma série informou peso. */
    topLoad: number | null;
    reps: number[];
    e1rm: number | null;
    note?: string;
}

// e1RM e tonelagem exigem peso e RPE medidos. As séries do modo simplificado não têm
// RPE e têm reps presumidas, então ficam fora dessas curvas em vez de virar número
// inventado. A carga informada é real: essa entra no gráfico de carga.
const measuredSets = (sets: SessionSet[]) => sets.filter(
    (set): set is SessionSet & { actualWeight: number; rpe: number } =>
        set.actualWeight !== null && set.rpe !== null
);

export const useExerciseAnalytics = (exerciseId: number) => {
    const [, navigate] = useLocation();
    const [selectedMetric, setSelectedMetric] = useState<AnalyticsMetric | null>(null);

    const { data: sessions, isLoading: sessionsLoading } = useQuery({
        queryKey: ["sessions", "exercise", exerciseId],
        queryFn: () => WorkoutSessionService.getByExerciseId(exerciseId)
    });

    const { data: records, isLoading: recordsLoading } = useQuery({
        queryKey: ["records", exerciseId],
        queryFn: () => PersonalRecordService.getByExerciseId(exerciseId)
    });

    // A API devolve em ordem crescente de conclusão: os gráficos leem assim, e a lista
    // de execuções inverte.
    const executions = useMemo<ExerciseExecutionRow[]>(() => (sessions ?? [])
        .filter((session) => session.sessionSet.length > 0)
        .map((session) => {
            const measured = measuredSets(session.sessionSet);
            const withLoad = session.sessionSet.filter((set) => set.actualWeight !== null);

            return {
                id: session.id,
                date: new Date(session.completedAt ?? session.startedAt),
                isSimple: session.trackingMode === "SIMPLE",
                setCount: session.sessionSet.length,
                topLoad: withLoad.length > 0 ? Math.max(...withLoad.map(externalLoad)) : null,
                reps: session.sessionSet.map((set) => set.actualReps),
                e1rm: measured.length > 0
                    ? Math.max(...measured.map((set) => calculateE1RM(set.actualWeight, set.actualReps, set.rpe, set.equipmentWeight ?? 0)))
                    : null,
                note: session.sessionSet[0]?.userObservation ?? undefined,
            };
        })
        .sort((a, b) => a.date.getTime() - b.date.getTime()), [sessions]);

    const series = useMemo<Record<AnalyticsMetric, ChartPoint[]>>(() => ({
        strength: executions.flatMap((row) => row.e1rm !== null ? [{ date: row.date, value: row.e1rm }] : []),
        load: executions.flatMap((row) => row.topLoad !== null && row.topLoad > 0 ? [{ date: row.date, value: row.topLoad }] : []),
        volume: (sessions ?? []).flatMap((session) => {
            const measured = measuredSets(session.sessionSet);

            if (measured.length === 0) return [];

            return [{
                date: new Date(session.completedAt ?? session.startedAt),
                value: measured.reduce((sum, set) => sum + calculateSetVolume(set.actualWeight, set.actualReps, set.equipmentWeight ?? 0), 0),
            }];
        }).sort((a, b) => a.date.getTime() - b.date.getTime()),
    }), [executions, sessions]);

    const hasStrength = series.strength.length > 0;
    const hasLoad = series.load.length > 0;

    const metric: AnalyticsMetric = selectedMetric ?? (hasStrength ? "strength" : "load");

    const trend = useMemo(() => {
        const points = series.strength;

        if (points.length < 2) return null;

        const first = points[0];
        const last = points[points.length - 1];
        const days = (last.date.getTime() - first.date.getTime()) / 86400000;

        return { delta: last.value - first.value, weeks: Math.max(1, Math.round(days / 7)) };
    }, [series.strength]);

    return {
        isLoading: sessionsLoading || recordsLoading,
        isEmpty: executions.length === 0,
        exerciseInfo: sessions?.[0]?.sessionSet?.[0]?.exercise,
        records,
        executions,
        series,
        metric,
        setMetric: setSelectedMetric,
        hasStrength,
        hasLoad,
        currentStrength: hasStrength ? series.strength[series.strength.length - 1].value : null,
        trend,
        goBack: () => navigate(path.HISTORY),
    };
};
