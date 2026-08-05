import { cn } from "@/lib/utils.ts";
import { formatWeightPtBr, type ProgressionAdvice } from "@/features/workouts/utils/progression.ts";
import { UNITS } from "@/core/constants/units.ts";

type ProgressionChipProps = {
    advice: ProgressionAdvice;
};

// Sem token novo: o index.css não tem --warning, e o único âmbar é --pr, que
// significa "conquista" — overloadá-lo seria desvio semântico. Vermelho no DELOAD
// é o sinal de parar, e é um par já validado em contraste.
const TONE: Record<ProgressionAdvice["verdict"], string> = {
    INCREASE:   "bg-success-subtle text-success-subtle-fg",
    HOLD:       "bg-muted text-muted-foreground",
    REPEAT:     "bg-muted text-muted-foreground",
    DELOAD:     "bg-destructive/10 text-destructive",
    NO_HISTORY: "bg-muted text-muted-foreground",
};

const label = (advice: ProgressionAdvice): string => {
    const weight = advice.suggestedWeight != null
        ? `${formatWeightPtBr(advice.suggestedWeight)} ${UNITS.WEIGHT}`
        : "";

    switch (advice.verdict) {
        case "INCREASE": return `Subir · ${weight}`;
        case "DELOAD":   return `Recuar · ${weight}`;
        case "REPEAT":   return `Repetir · ${weight}`;
        case "HOLD":     return `Manter · ${advice.suggestedReps} reps`;
        default:         return "Sem histórico";
    }
};

/**
 * Ocupa o slot do placeholder "Padrão" na faixa de chips do header do card.
 * Custo vertical zero — o card é o [data-keyboard-anchor] e qualquer altura extra
 * derruba useKeepFocusedFieldVisible para o fallback que esconde o botão Confirmar.
 */
export const ProgressionChip = ({ advice }: ProgressionChipProps) => (
    <span
        className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-medium whitespace-nowrap",
            TONE[advice.verdict]
        )}
    >
        {label(advice)}
    </span>
);
