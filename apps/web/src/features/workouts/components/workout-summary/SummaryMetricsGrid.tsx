import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

const staggerItem: Variants = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 380, damping: 28 } },
};

type Metric = { label: string; value: string };

type Props = {
    /** Número principal da sessão. Ausente quando não há volume a mostrar. */
    lead?: Metric & { deltaPercent?: number | null };
    metrics: Metric[];
};

/** Um cartão dividido, não três caixas: em caixas estreitas "4.703 kg" quebrava em duas linhas. */
const SummaryMetricsGrid = ({ lead, metrics }: Props) => (
    <motion.section variants={staggerItem} className="bg-card border border-border rounded-xl">
        {lead && (
            <div className="p-4 border-b border-border">
                <p className="text-[13px] text-muted-foreground">{lead.label}</p>
                <p className="text-[40px] font-semibold tracking-[-0.04em] leading-none tabular-nums mt-1.5">
                    {lead.value}
                </p>
                {lead.deltaPercent != null && (
                    <p className={cn(
                        "text-[13px] font-medium tabular-nums mt-2",
                        lead.deltaPercent >= 0 ? "text-success" : "text-muted-foreground"
                    )}>
                        {lead.deltaPercent >= 0 ? "+" : "−"}{Math.abs(lead.deltaPercent)}%
                        <span className="font-normal text-muted-foreground"> em relação à última vez</span>
                    </p>
                )}
            </div>
        )}
        <div className="grid" style={{ gridTemplateColumns: `repeat(${metrics.length}, minmax(0, 1fr))` }}>
            {metrics.map((metric, index) => (
                <div key={metric.label} className={cn("p-4", index > 0 && "border-l border-border")}>
                    <p className="text-[13px] text-muted-foreground">{metric.label}</p>
                    <p className="text-[20px] font-semibold tracking-[-0.02em] leading-none tabular-nums mt-1.5">
                        {metric.value}
                    </p>
                </div>
            ))}
        </div>
    </motion.section>
);

export default SummaryMetricsGrid;
