import { motion, type Variants } from "framer-motion";

const staggerItem: Variants = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 380, damping: 28 } },
};

type Metric = { label: string; value: string; unit: string | null };
type Props = { metrics: Metric[] };

const SummaryMetricsGrid = ({ metrics }: Props) => (
    <motion.div variants={staggerItem} className="grid grid-cols-3 gap-3 mx-4 mb-4">
        {metrics.map(m => (
            <div key={m.label} className="bg-card border border-border rounded-xl p-3 flex flex-col gap-1 min-w-0 overflow-hidden">
                <p className="text-[11px] font-medium tracking-[0.04em] uppercase text-muted-foreground">
                    {m.label}
                </p>
                <p className="text-[22px] font-medium tracking-[-0.03em] text-foreground leading-none">
                    {m.value}
                    {m.unit && (
                        <span className="text-[13px] font-normal text-muted-foreground ml-1">
                            {m.unit}
                        </span>
                    )}
                </p>
            </div>
        ))}
    </motion.div>
);

export default SummaryMetricsGrid;
