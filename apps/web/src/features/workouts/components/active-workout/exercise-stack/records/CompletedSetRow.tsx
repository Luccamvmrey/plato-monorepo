import { Check } from "lucide-react";
import type { SessionSet } from "@/features/workouts/workout.types.ts";
import { UNITS } from "@/core/constants/units.ts";
import { formatWeightPtBr } from "@/features/workouts/utils/progression.ts";

type CompletedSetRowProps = {
    log: SessionSet;
    /** Desvio em relação à carga prescrita. A comparação é feita no card, que tem o advice. */
    deviation?: "up" | "down";
};

/** Uma linha de uma lista: quem a usa desenha o contêiner e os divisores. */
export const CompletedSetRow = ({ log, deviation }: CompletedSetRowProps) => (
    <div className="flex items-center gap-2.5 h-10 px-3">
        <Check className="size-4 text-success shrink-0" strokeWidth={2.5} aria-hidden />
        <span className="text-[13px] text-muted-foreground tabular-nums w-11 shrink-0">
            {UNITS.SINGLE_SET} {log.setNumber}
        </span>
        <span className="ml-auto text-[13px] font-medium tabular-nums whitespace-nowrap">
            {deviation && (
                <span
                    aria-label={deviation === "up" ? "acima do prescrito" : "abaixo do prescrito"}
                    className="mr-1 text-muted-foreground"
                >
                    {deviation === "up" ? "↑" : "↓"}
                </span>
            )}
            {/* != null e não truthiness: 0 kg é carga legítima. Null é o modo
                simplificado, em que peso e RPE podem não existir. */}
            {[
                log.actualWeight != null ? `${formatWeightPtBr(log.actualWeight)} ${UNITS.WEIGHT}` : null,
                `${log.actualReps} ${UNITS.REPS}s`,
            ].filter(Boolean).join(" × ")}
        </span>
        {log.rpe != null && (
            <span className="text-[13px] text-muted-foreground tabular-nums w-[52px] text-right shrink-0">
                RPE {log.rpe}
            </span>
        )}
    </div>
);
