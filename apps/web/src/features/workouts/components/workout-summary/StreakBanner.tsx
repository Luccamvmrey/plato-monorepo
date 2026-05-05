import { motion } from "framer-motion";
import type { StreakData } from "@/features/user/hooks/useStreakData";

type Props = { streak: StreakData };

const StreakBanner = ({ streak }: Props) => {
    if (streak.currentStreak === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mx-4 mb-4 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center gap-3"
        >
            <span className="text-[20px] leading-none flex-shrink-0">🔥</span>
            <div>
                <p className="text-[13px] font-medium text-orange-600 dark:text-orange-400">
                    Sequência mantida!
                </p>
                <p className="text-[12px] text-orange-600/70 dark:text-orange-400/70">
                    {streak.currentStreak} {streak.currentStreak === 1 ? 'dia consecutivo' : 'dias consecutivos'}
                </p>
            </div>
        </motion.div>
    );
};

export default StreakBanner;
