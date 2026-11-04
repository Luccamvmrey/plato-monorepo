import { formatDateCustom } from "@/core/utils/formatters";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
} from "recharts";
import { cn } from "@/lib/utils";
import type { FC } from "react";

export interface AnalyticsChartProps {
    data: { date: Date; value: number }[];
    /** Texto do placeholder enquanto não há 3 sessões. */
    emptyLabel: string;
}

const COLOR = "var(--color-primary)";

const formatValue = (value: number) => value.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

interface ChartTooltipProps {
    active?: boolean;
    payload?: { value: number }[];
    label?: number;
}

const ChartTooltip = ({ active, payload, label }: ChartTooltipProps) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-popover border border-border rounded-lg px-3 py-2">
            <p className="text-[12px] text-muted-foreground">{formatDateCustom(label ?? 0, "dd/MM/yyyy")}</p>
            <p className="text-[14px] font-medium tabular-nums">{formatValue(payload[0].value)} kg</p>
        </div>
    );
};

const ChartEmpty = ({ current, label }: { current: number; label: string }) => {
    const total = 3;
    const remaining = total - current;
    return (
        <div className="flex items-center justify-between gap-3 py-1">
            <p className="text-[13px] text-muted-foreground">
                {label} em {remaining} {remaining === 1 ? "sessão" : "sessões"}
            </p>
            <div className="flex gap-1.5 shrink-0" aria-hidden="true">
                {Array.from({ length: total }).map((_, i) => (
                    <div
                        key={i}
                        className={cn("w-2.5 h-2.5 rounded-[3px]", i < current ? "bg-primary" : "bg-muted")}
                    />
                ))}
            </div>
        </div>
    );
};

const axisStyle = {
    tick: { fontSize: 11, fill: "var(--color-muted-foreground)" },
    axisLine: false as const,
    tickLine: false as const,
};

const chartMargin = { top: 8, right: 0, left: 0, bottom: 0 };

export const AnalyticsChart: FC<AnalyticsChartProps> = ({ data, emptyLabel }) => {
    if (data.length < 3) {
        return <ChartEmpty current={data.length} label={emptyLabel} />;
    }

    const formattedData = data.map(d => ({
        ...d,
        timestamp: d.date.getTime(),
    }));

    // Eixo a partir do mínimo, não de zero: progressão de carga é 1 a 3% por semana, e
    // um eixo em zero achatava qualquer curva numa linha reta.
    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = Math.max((max - min) * 0.2, max * 0.02, 1);
    const lastIndex = formattedData.length - 1;

    return (
        <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={formattedData} margin={chartMargin}>
                <XAxis
                    dataKey="timestamp"
                    type="number"
                    domain={["dataMin", "dataMax"]}
                    tickFormatter={(t) => formatDateCustom(t, "dd/MM")}
                    {...axisStyle}
                    tickCount={4}
                    minTickGap={40}
                />
                <YAxis
                    {...axisStyle}
                    orientation="right"
                    width={40}
                    tickCount={4}
                    domain={[Math.max(0, Math.floor(min - padding)), Math.ceil(max + padding)]}
                    tickFormatter={(v: number) => Math.round(v).toLocaleString("pt-BR")}
                />
                <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ stroke: "var(--color-border)" }}
                />
                <Area
                    type="monotone"
                    dataKey="value"
                    stroke={COLOR}
                    strokeWidth={2.5}
                    fill={COLOR}
                    fillOpacity={0.08}
                    // Só o último ponto: é o "onde estou agora" que se procura no gráfico.
                    dot={(props: { cx?: number; cy?: number; index?: number }) => (
                        props.index === lastIndex
                            ? <circle key="last" cx={props.cx} cy={props.cy} r={4.5} fill={COLOR} stroke="var(--color-card)" strokeWidth={2} />
                            : <g key={props.index} />
                    )}
                    activeDot={{ r: 5, strokeWidth: 0, fill: COLOR }}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
};
