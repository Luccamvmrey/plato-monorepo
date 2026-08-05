import type { StreakData } from "../hooks/useStreakData";
import { StreakDayMarker } from "@/core/components/StreakDayMarker.tsx";

const DAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

type Props = { streak: StreakData };

const StreakCard = ({ streak }: Props) => {
    const restRemaining = 2 - streak.restDaysUsedThisWeek;

    return (
        <div className="mx-4 mb-4 bg-card border rounded-xl p-4">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.05em] mb-3">
                Sequência
            </p>

            <div className="flex items-baseline gap-1.5 mb-4">
                <span className="text-[36px] font-semibold tracking-[-0.03em] leading-none">
                    {streak.currentStreak}
                </span>
                <span className="text-[13px] text-muted-foreground">
                    {streak.currentStreak === 1 ? 'dia' : 'dias'}
                </span>
            </div>

            <div className="flex justify-between mb-3">
                {streak.weekDays.map((day) => (
                    <div key={day.date} className="flex flex-col items-center gap-1.5">
                        <StreakDayMarker
                            status={day.status}
                            size="md"
                            label={DAY_LABELS[day.dayOfWeek]}
                        />
                        <span className="text-[10px] text-muted-foreground">
                            {DAY_LABELS[day.dayOfWeek]}
                        </span>
                    </div>
                ))}
            </div>

            <p className="text-[12px] text-muted-foreground">
                {restRemaining === 2
                    ? 'Nenhum dia livre usado esta semana'
                    : restRemaining === 1
                        ? '1 dia livre restante esta semana'
                        : 'Dias livres desta semana esgotados'}
            </p>
        </div>
    );
};

export default StreakCard;
