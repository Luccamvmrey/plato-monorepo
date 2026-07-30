import { Flame } from "lucide-react";
import type { StreakData } from "@/features/user/hooks/useStreakData";
import { StreakDayMarker } from "@/core/components/StreakDayMarker.tsx";

type Props = { streak: StreakData };

const StreakWidget = ({ streak }: Props) => (
    <div className="mx-0 mb-1 bg-card/60 border rounded-xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <Flame className="size-4 text-pr" aria-hidden="true" />
            <span className="text-[14px] font-medium tracking-[-0.02em]">
                {streak.currentStreak}
            </span>
            <span className="text-[12px] text-muted-foreground">
                {streak.currentStreak === 1 ? 'dia' : 'dias'}
            </span>
        </div>

        <div className="flex items-center gap-1">
            {streak.weekDays.map((day) => (
                <StreakDayMarker key={day.date} status={day.status} />
            ))}
        </div>
    </div>
);

export default StreakWidget;
