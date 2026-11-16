import { formatWeight } from "@/core/utils/formatters.ts";
import type { JamPartnerTurn } from "@/features/jam/hooks/useJamTurn.ts";
import { useElapsedClock } from "@/features/jam/hooks/useElapsedClock.ts";

/**
 * No revezamento, a vez é de outra pessoa: ocupa o lugar do descanso, porque o descanso de
 * um é a série do outro. Quem usa remonta a cada troca de vez (`key`), e o relógio recomeça.
 */
export const JamPartnerTurnPanel = ({ turn }: { turn: JamPartnerTurn }) => {
    const clock = useElapsedClock();

    return (
        <div role="status" className="h-12 flex items-center gap-3">
            <span role="timer" className="text-[22px] font-semibold tabular-nums tracking-[-0.02em]">{clock}</span>
            <span className="flex-1 min-w-0 text-[14px] text-muted-foreground truncate">
                <span className="text-foreground font-medium">{turn.name}</span> treinando
                {turn.weightKg !== null && <> · {formatWeight(turn.weightKg)}</>}
            </span>
        </div>
    );
};
