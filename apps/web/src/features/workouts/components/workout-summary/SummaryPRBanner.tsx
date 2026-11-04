import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import type { SummaryStats } from "@/features/workouts/hooks/useWorkoutSummaryStats";
import { formatWeightPtBr } from "@/features/workouts/utils/progression";
import { UNITS } from "@/core/constants/units";

type Props = { newPRs: SummaryStats["newPRs"] };

/** O momento de comemorar do resumo: o único trecho em âmbar da tela. */
const SummaryPRBanner = ({ newPRs }: Props) => {
    if (newPRs.length === 0) return null;

    return (
        <motion.section
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="p-4 rounded-xl bg-pr-subtle text-pr-subtle-fg flex flex-col gap-3"
        >
            <h2 className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.02em]">
                <Trophy className="size-5 shrink-0" aria-hidden />
                {newPRs.length === 1 ? "Novo recorde pessoal" : `${newPRs.length} novos recordes`}
            </h2>
            <ul className="flex flex-col gap-2">
                {newPRs.map((pr) => (
                    <li key={pr.exerciseId} className="flex items-baseline justify-between gap-3 text-[14px]">
                        <span className="min-w-0 truncate">{pr.exerciseName}</span>
                        <span className="tabular-nums whitespace-nowrap">
                            {pr.previousMax !== null && (
                                <span className="opacity-70">{formatWeightPtBr(pr.previousMax)} → </span>
                            )}
                            <span className="font-semibold">{formatWeightPtBr(pr.newMax)} {UNITS.WEIGHT}</span>
                        </span>
                    </li>
                ))}
            </ul>
        </motion.section>
    );
};

export default SummaryPRBanner;
