import { motion, type Variants } from "framer-motion";
import { MuscleBadge } from "@/core/components/MuscleBadge";
import type { SummaryStats } from "@/features/workouts/hooks/useWorkoutSummaryStats";
import { UNITS } from "@/core/constants/units";

const staggerItem: Variants = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 380, damping: 28 } },
};

type Props = { volumeByGroup: SummaryStats["volumeByGroup"] };

const SummaryVolumeChart = ({ volumeByGroup }: Props) => {
    if (volumeByGroup.length === 0) return null;

    return (
        <motion.div
            variants={staggerItem}
            className="mx-4 mb-4 bg-card border border-border rounded-xl p-4"
        >
            <p className="text-[13px] font-medium text-foreground mb-3">Distribuição de volume</p>
            {volumeByGroup.map(({ group, volume, percentage }) => (
                <div key={group} className="mb-3 last:mb-0">
                    <div className="flex items-center justify-between mb-1.5">
                        <MuscleBadge muscle={group} />
                        <span className="text-[12px] text-muted-foreground">
                            {Math.round(volume)}{UNITS.WEIGHT} · {Math.round(percentage)}%
                        </span>
                    </div>
                    <div className="h-[3px] bg-muted rounded-full overflow-hidden">
                        <motion.div
                            className="h-full rounded-full"
                            style={{
                                background: `var(--muscle-${group.toLowerCase().replace(/_/g, "-")})`,
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
                        />
                    </div>
                </div>
            ))}
        </motion.div>
    );
};

export default SummaryVolumeChart;
