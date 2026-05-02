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
    color: string;
    gradientId: string;
}

interface TooltipEntry {
    name: string;
    value: number;
    color: string;
}

interface ChartTooltipProps {
    active?: boolean;
    payload?: TooltipEntry[];
    label?: number;
}

const ChartTooltip = ({ active, payload, label }: ChartTooltipProps) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-card border border-border rounded-lg px-3 py-2">
            <p className="text-[11px] text-muted-foreground mb-1">
                {formatDateCustom(label ?? 0, "dd/MM/yyyy")}
            </p>
            {payload.map((p) => (
                <p key={p.name} className="text-[13px] font-medium" style={{ color: p.color }}>
                    {p.value.toFixed(1)} kg
                </p>
            ))}
        </div>
    );
};

const ChartEmpty = ({ current }: { current: number }) => {
    const total = 3;
    const remaining = total - current;
    return (
        <div className="h-[160px] flex flex-col items-center justify-center gap-2">
            <p className="text-[13px] text-muted-foreground text-center">
                Complete mais {remaining} {remaining === 1 ? "sessão" : "sessões"} para ver a evolução
            </p>
            <div className="flex gap-1.5">
                {Array.from({ length: total }).map((_, i) => (
                    <div
                        key={i}
                        className={cn("w-2 h-2 rounded-full", i < current ? "bg-primary" : "bg-muted")}
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

const chartMargin = { top: 8, right: 8, left: -16, bottom: 0 };

export const AnalyticsChart: FC<AnalyticsChartProps> = ({ data, color, gradientId }) => {
    if (data.length < 3) {
        return <ChartEmpty current={data.length} />;
    }

    const formattedData = data.map(d => ({
        ...d,
        timestamp: d.date.getTime(),
    }));

    return (
        <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={formattedData} margin={chartMargin}>
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.15} />
                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <XAxis
                    dataKey="timestamp"
                    type="number"
                    domain={["dataMin", "dataMax"]}
                    tickFormatter={(t) => formatDateCustom(t, "dd/MM")}
                    {...axisStyle}
                    minTickGap={30}
                />
                <YAxis {...axisStyle} />
                <Tooltip content={<ChartTooltip />} />
                <Area
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    strokeWidth={2}
                    fill={`url(#${gradientId})`}
                    dot={{ fill: color, strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
};
