import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import type { SummaryStats } from "@/features/workouts/hooks/useWorkoutSummaryStats";
import { UNITS } from "@/core/constants/units";

type Props = { newPRs: SummaryStats["newPRs"] };

const SummaryPRBanner = ({ newPRs }: Props) => {
    if (newPRs.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mx-4 mb-4 p-4 rounded-xl bg-pr-subtle border border-pr/20 flex items-start gap-3"
        >
            <Trophy className="w-5 h-5 text-pr flex-shrink-0 mt-0.5" />
            <div>
                <p className="text-[13px] font-medium text-pr-subtle-fg mb-1">
                    {newPRs.length === 1 ? "Novo recorde pessoal!" : `${newPRs.length} novos recordes!`}
                </p>
                {newPRs.map(pr => (
                    <p key={pr.exerciseId} className="text-[12px] text-pr-subtle-fg/80">
                        {pr.exerciseName} —{" "}
                        {pr.previousMax !== null
                            ? `${pr.previousMax}${UNITS.WEIGHT} → ${pr.newMax}${UNITS.WEIGHT}`
                            : `Novo recorde: ${pr.newMax}${UNITS.WEIGHT}`}
                    </p>
                ))}
            </div>
        </motion.div>
    );
};

export default SummaryPRBanner;
