import type { AdminMetrics } from "@plato/shared";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { formatDateCustom } from "@/core/utils/formatters.ts";
import { cn } from "@/lib/utils.ts";
import type { ChartWeeks, WeeklyMetric } from "../hooks/useAdminDashboard.ts";

const WEEK_OPTIONS: ChartWeeks[] = [4, 12, 26];

type WeekRow = AdminMetrics["weekly"][number];

const plural = (value: number, singular: string, pluralForm: string) =>
    `${value} ${value === 1 ? singular : pluralForm}`;

const METRICS: { key: WeeklyMetric; tab: string; describe: (week: WeekRow) => string }[] = [
    { key: "activeUsers", tab: "Ativos", describe: (w) => plural(w.activeUsers, "pessoa ativa", "pessoas ativas") },
    { key: "sessions", tab: "Treinos", describe: (w) => plural(w.sessions, "treino", "treinos") },
    { key: "signups", tab: "Cadastros", describe: (w) => plural(w.signups, "cadastro", "cadastros") },
    {
        key: "completionRate",
        tab: "Conclusão",
        describe: (w) => w.completionRate === null
            ? "Nenhum treino iniciado"
            : `${w.completionRate}% · ${w.startedAndCompleted} de ${w.started} concluídos`,
    },
];

const axisStyle = {
    tick: { fontSize: 11, fill: "var(--color-muted-foreground)" },
    axisLine: false as const,
    tickLine: false as const,
};

/** Meio-dia: `weekStart` é uma data local, e meia-noite em UTC cairia no dia anterior. */
const toDate = (weekStart: string) => new Date(`${weekStart}T12:00:00`);

interface ChartTooltipProps {
    active?: boolean;
    payload?: { payload: WeekRow }[];
    label?: string;
    describe: (week: WeekRow) => string;
}

const ChartTooltip = ({ active, payload, label, describe }: ChartTooltipProps) => {
    if (!active || !payload?.length || !label) return null;

    return (
        <div className="bg-popover border border-border rounded-lg px-3 py-2">
            <p className="text-[12px] text-muted-foreground">Semana de {formatDateCustom(toDate(label), "dd/MM")}</p>
            <p className="text-[14px] font-medium tabular-nums">{describe(payload[0].payload)}</p>
        </div>
    );
};

interface WeeklyChartProps {
    weekly: AdminMetrics["weekly"];
    metric: WeeklyMetric;
    onMetricChange: (metric: WeeklyMetric) => void;
    weeks: ChartWeeks;
    onWeeksChange: (weeks: ChartWeeks) => void;
}

export const WeeklyChart = ({ weekly, metric, onMetricChange, weeks, onWeeksChange }: WeeklyChartProps) => {
    const { describe } = METRICS.find(({ key }) => key === metric)!;
    const isRate = metric === "completionRate";

    return (
        <section className="bg-card border border-border rounded-xl p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-[17px] font-semibold tracking-[-0.02em]">Por semana</h2>
                <Select value={String(weeks)} onValueChange={(value) => onWeeksChange(Number(value) as ChartWeeks)}>
                    <SelectTrigger aria-label="Período do gráfico" className="w-[130px] h-9 rounded-lg text-[13px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {WEEK_OPTIONS.map((option) => (
                            <SelectItem key={option} value={String(option)}>{option} semanas</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div role="tablist" aria-label="Métrica do gráfico" className="grid grid-cols-4 gap-1 rounded-lg bg-muted p-1">
                {METRICS.map(({ key, tab }) => (
                    <button
                        key={key}
                        type="button"
                        role="tab"
                        aria-selected={metric === key}
                        onClick={() => onMetricChange(key)}
                        className={cn(
                            "h-9 rounded-md text-[13px] font-medium transition-colors",
                            metric === key ? "bg-card text-foreground" : "text-muted-foreground"
                        )}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <ResponsiveContainer width="100%" height={160}>
                <BarChart data={weekly} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                    <XAxis
                        dataKey="weekStart"
                        tickFormatter={(week: string) => formatDateCustom(toDate(week), "dd/MM")}
                        minTickGap={32}
                        {...axisStyle}
                    />
                    <YAxis
                        {...axisStyle}
                        orientation="right"
                        width={isRate ? 36 : 28}
                        allowDecimals={false}
                        domain={isRate ? [0, 100] : [0, "auto"]}
                        tickFormatter={(value: number) => (isRate ? `${value}%` : String(value))}
                    />
                    <Tooltip content={<ChartTooltip describe={describe} />} cursor={{ fill: "var(--color-muted)" }} />
                    <Bar dataKey={metric} fill="var(--color-primary)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </BarChart>
            </ResponsiveContainer>
        </section>
    );
};
