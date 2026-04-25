import { format } from "date-fns";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";

interface AnalyticsChartProps {
    data: {
        date: Date;
        value: number;
    }[];
    tooltipSuffix?: string;
    strokeColor?: string;
    fillColor?: string;
}

const CustomTooltip = ({ active, payload, label, suffix }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-popover border rounded-lg shadow-xl p-3 flex flex-col gap-1">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                    {format(new Date(label), "dd MMM yyyy")}
                </p>
                <p className="text-sm font-black text-foreground">
                    {payload[0].value.toLocaleString()} {suffix}
                </p>
            </div>
        );
    }
    return null;
};

export const AnalyticsChart = ({
    data,
    tooltipSuffix = "kg",
    strokeColor = "#10b981", // emerald-500
    fillColor = "rgba(16, 185, 129, 0.1)"
}: AnalyticsChartProps) => {
    if (data.length === 0) {
        return (
            <div className="h-[200px] w-full flex items-center justify-center text-muted-foreground text-sm italic border-2 border-dashed rounded-xl">
                Sem dados históricos suficientes
            </div>
        );
    }

    // Format data for Recharts (convert Date to ISO or timestamp for consistent axis handling)
    const formattedData = data.map(d => ({
        ...d,
        timestamp: d.date.getTime(),
    }));

    return (
        <div className="h-[200px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={formattedData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid 
                        strokeDasharray="3 3" 
                        vertical={false} 
                        stroke="currentColor" 
                        className="text-muted-foreground/10"
                    />
                    <XAxis 
                        dataKey="timestamp" 
                        type="number"
                        domain={['dataMin', 'dataMax']}
                        tickFormatter={(time) => format(new Date(time), "dd/MM")}
                        stroke="currentColor"
                        className="text-[10px] text-muted-foreground"
                        axisLine={false}
                        tickLine={false}
                        minTickGap={30}
                    />
                    <YAxis 
                        stroke="currentColor"
                        className="text-[10px] text-muted-foreground"
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip 
                        content={<CustomTooltip suffix={tooltipSuffix} />} 
                        cursor={{ stroke: strokeColor, strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={strokeColor}
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                        animationDuration={1500}
                        dot={{ r: 4, fill: strokeColor, strokeWidth: 2, stroke: "#fff" }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
