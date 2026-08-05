import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import type { StreakData } from "@/features/user/hooks/useStreakData";

type Props = { streak: StreakData };

const StreakBanner = ({ streak }: Props) => {
    if (streak.currentStreak === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            // Família --pr em vez de orange-* cru: os tokens já cobrem light/dark e o
            // orange-600 sobre fundo claro ficava abaixo de 4.5:1.
            className="mx-4 mb-4 p-4 rounded-xl bg-pr-subtle border border-pr/20 flex items-center gap-3"
        >
            <Flame className="size-5 text-pr-subtle-fg flex-shrink-0" aria-hidden="true" />
            <div>
                <p className="text-[13px] font-medium text-pr-subtle-fg">
                    Sequência mantida!
                </p>
                <p className="text-[12px] text-pr-subtle-fg/80">
                    {streak.currentStreak} {streak.currentStreak === 1 ? 'dia consecutivo' : 'dias consecutivos'}
                </p>
            </div>
        </motion.div>
    );
};

export default StreakBanner;
