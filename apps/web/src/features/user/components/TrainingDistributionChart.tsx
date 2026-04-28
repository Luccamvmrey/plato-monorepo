import { motion } from "framer-motion";
import { PieChart } from "lucide-react";
import { MuscleBadge } from "@/core/components/MuscleBadge";
import type { MuscleGroup } from "@plato/database/generated/prisma/enums";

interface TrainingDistributionChartProps {
    distribution: Array<{ muscle: string; percentage: number }>;
}

export const TrainingDistributionChart = ({ distribution }: TrainingDistributionChartProps) => {
    const sorted = distribution.slice().sort((a, b) => b.percentage - a.percentage);

    return (
        <div className="mx-4 mb-4 bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
                <PieChart className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <p className="text-[13px] font-medium text-foreground">Distribuição de treino</p>
            </div>

            {sorted.length === 0 ? (
                <p className="text-[13px] text-muted-foreground text-center py-4">
                    Sem dados de distribuição disponíveis.
                </p>
            ) : (
                sorted.map(({ muscle, percentage }) => (
                    <div key={muscle} className="mb-3 last:mb-0">
                        <div className="flex items-center justify-between mb-1.5">
                            <MuscleBadge muscle={muscle as MuscleGroup} />
                            <span className="text-[12px] text-muted-foreground">
                                {Math.round(percentage)}%
                            </span>
                        </div>
                        <div className="h-[3px] bg-muted rounded-full overflow-hidden">
                            <motion.div
                                className="h-full rounded-full"
                                style={{
                                    background: `var(--muscle-${muscle.toLowerCase().replace(/_/g, "-")})`,
                                }}
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                            />
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};
