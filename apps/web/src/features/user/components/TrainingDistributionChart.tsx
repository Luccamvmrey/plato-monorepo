import { motion } from "framer-motion";
import { muscleGroupTranslation } from "@/core/utils/translations";
import type { MuscleGroup } from "@plato/database/generated/prisma/enums";

interface TrainingDistributionChartProps {
    distribution: Array<{ muscle: string; percentage: number }>;
}

/** Uma cor só: o que se compara é o comprimento das barras. */
export const TrainingDistributionChart = ({ distribution }: TrainingDistributionChartProps) => {
    const sorted = distribution.slice().sort((a, b) => b.percentage - a.percentage);

    return (
        <section className="mx-4 mb-4 bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
            <h2 className="text-[15px] font-medium tracking-[-0.02em]">Distribuição do volume</h2>

            {sorted.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">Sem dados de distribuição ainda.</p>
            ) : (
                sorted.map(({ muscle, percentage }) => (
                    <div key={muscle} className="flex flex-col gap-1.5">
                        <div className="flex items-baseline justify-between gap-3">
                            <span className="text-[14px]">{muscleGroupTranslation[muscle as MuscleGroup]}</span>
                            <span className="text-[13px] text-muted-foreground tabular-nums">
                                {Math.round(percentage)}%
                            </span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <motion.div
                                className="h-full rounded-full bg-primary"
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                            />
                        </div>
                    </div>
                ))
            )}
        </section>
    );
};
