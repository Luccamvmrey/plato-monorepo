import { Flame } from "lucide-react";
import type { StreakData } from "@/features/user/hooks/useStreakData";

type Props = { streak: StreakData };

/** Uma linha junto do título: dois blocos em âmbar seguidos disputavam com os recordes. */
const StreakBanner = ({ streak }: Props) => {
    if (streak.currentStreak === 0) return null;

    return (
        <p className="flex items-center gap-1.5 text-[13px] font-medium text-pr-subtle-fg dark:text-pr mt-2">
            <Flame className="size-4 shrink-0" aria-hidden="true" />
            Sequência de {streak.currentStreak} {streak.currentStreak === 1 ? "dia" : "dias"}
        </p>
    );
};

export default StreakBanner;
