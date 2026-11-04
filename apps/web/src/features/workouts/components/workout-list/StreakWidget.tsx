import { Flame } from "lucide-react";
import type { StreakData } from "@/features/user/hooks/useStreakData";
import { StreakDayMarker } from "@/core/components/StreakDayMarker.tsx";

type Props = { streak: StreakData };

/** Sem caixa: é contexto da tela, não um item dela. A caixa competia com o próximo treino. */
const StreakWidget = ({ streak }: Props) => (
    <div className="flex items-center justify-between gap-3 px-1">
        <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <Flame className="size-4 text-pr shrink-0" aria-hidden="true" />
            <span className="font-medium text-foreground tabular-nums">{streak.currentStreak}</span>
            {streak.currentStreak === 1 ? "dia seguido" : "dias seguidos"}
        </p>

        <div className="flex items-center gap-1">
            {streak.weekDays.map((day) => (
                <StreakDayMarker key={day.date} status={day.status} />
            ))}
        </div>
    </div>
);

export default StreakWidget;
