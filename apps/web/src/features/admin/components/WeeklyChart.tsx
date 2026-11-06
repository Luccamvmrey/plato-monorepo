import type { AdminMetrics } from "@plato/shared";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDateCustom } from "@/core/utils/formatters.ts";
import { cn } from "@/lib/utils.ts";
import type { WeeklyMetric } from "../hooks/useAdminDashboard.ts";

const METRICS: { key: WeeklyMetric; tab: string; unit: [string, string] }[] = [
    { key: "activeUsers", tab: "Ativos", unit: ["pessoa ativa", "pessoas ativas"] },
    { key: "sessions", tab: "Treinos", unit: ["treino", "treinos"] },
    { key: "signups", tab: "Cadastros", unit: ["cadastro", "cadastros"] },
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
    payload?: { value: number }[];
    label?: string;
    unit: [string, string];
}

const ChartTooltip = ({ active, payload, label, unit }: ChartTooltipProps) => {
    if (!active || !payload?.length || !label) return null;

    const value = payload[0].value;

    return (
        <div className="bg-popover border border-border rounded-lg px-3 py-2">
            <p className="text-[12px] text-muted-foreground">Semana de {formatDateCustom(toDate(label), "dd/MM")}</p>
            <p className="text-[14px] font-medium tabular-nums">{value} {value === 1 ? unit[0] : unit[1]}</p>
        </div>
    );
};

interface WeeklyChartProps {
    weekly: AdminMetrics["weekly"];
    metric: WeeklyMetric;
    onMetricChange: (metric: WeeklyMetric) => void;
}

export const WeeklyChart = ({ weekly, metric, onMetricChange }: WeeklyChartProps) => {
    const { unit } = METRICS.find(({ key }) => key === metric)!;

    return (
        <section className="bg-card border border-border rounded-xl p-4 flex flex-col gap-4">
            <p className="text-[13px] text-muted-foreground">Últimas 12 semanas</p>

            <div role="tablist" aria-label="Métrica do gráfico" className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
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
                    <YAxis {...axisStyle} orientation="right" width={28} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip unit={unit} />} cursor={{ fill: "var(--color-muted)" }} />
                    <Bar dataKey={metric} fill="var(--color-primary)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </BarChart>
            </ResponsiveContainer>
        </section>
    );
};
