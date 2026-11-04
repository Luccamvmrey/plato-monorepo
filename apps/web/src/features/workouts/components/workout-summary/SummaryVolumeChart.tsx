import { motion, type Variants } from "framer-motion";
import { muscleGroupTranslation } from "@/core/utils/translations";
import type { SummaryStats } from "@/features/workouts/hooks/useWorkoutSummaryStats";
import { UNITS } from "@/core/constants/units";

const staggerItem: Variants = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 380, damping: 28 } },
};

type Props = { volumeByGroup: SummaryStats["volumeByGroup"] };

/** Uma cor só: o que importa é o comprimento da barra, não qual grupo é qual. */
const SummaryVolumeChart = ({ volumeByGroup }: Props) => {
    const groups = volumeByGroup.filter(({ volume }) => volume > 0);

    // Com um grupo só, "100%" não diz nada que o resto da tela já não tenha dito.
    if (groups.length < 2) return null;

    return (
        <motion.section variants={staggerItem} className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
            <h2 className="text-[15px] font-medium tracking-[-0.02em]">Volume por grupo</h2>
            {groups.map(({ group, volume, percentage }) => (
                <div key={group} className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between gap-3">
                        <span className="text-[14px]">{muscleGroupTranslation[group]}</span>
                        <span className="text-[13px] text-muted-foreground tabular-nums">
                            {Math.round(volume).toLocaleString("pt-BR")} {UNITS.WEIGHT} · {Math.round(percentage)}%
                        </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                            className="h-full rounded-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
                        />
                    </div>
                </div>
            ))}
        </motion.section>
    );
};

export default SummaryVolumeChart;
