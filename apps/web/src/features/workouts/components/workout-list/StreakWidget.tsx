import type { StreakData } from "@/features/user/hooks/useStreakData";

const STATUS_COLOR: Record<string, string> = {
    trained: 'bg-orange-400',
    rest_used: 'bg-muted-foreground/25',
    future: 'bg-muted-foreground/10',
};

type Props = { streak: StreakData };

const StreakWidget = ({ streak }: Props) => (
    <div className="mx-0 mb-1 bg-card/60 border rounded-xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <span className="text-[16px] leading-none">🔥</span>
            <span className="text-[14px] font-medium tracking-[-0.02em]">
                {streak.currentStreak}
            </span>
            <span className="text-[12px] text-muted-foreground">
                {streak.currentStreak === 1 ? 'dia' : 'dias'}
            </span>
        </div>

        <div className="flex items-center gap-1">
            {streak.weekDays.map((day) => (
                <span
                    key={day.date}
                    className={`w-2 h-2 rounded-full ${STATUS_COLOR[day.status]}`}
                />
            ))}
        </div>
    </div>
);

export default StreakWidget;
