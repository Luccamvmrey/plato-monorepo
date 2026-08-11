import { cn } from "@/lib/utils.ts";
import { DEVIATION_LABEL, type DeviationKind } from "@/features/workouts/utils/session-deviation.ts";

type DeviationBadgeProps = {
    kind: DeviationKind;
    /** Nome do exercício relacionado — o substituído, ou quem entrou no lugar. */
    relatedName?: string;
    className?: string;
};

/**
 * Marcação neutra, sem cor de alerta: trocar ou pular exercício é decisão legítima do
 * treino, não erro a ser sinalizado. `NOT_DONE` é o único que ganha um tom próprio,
 * porque é o que o usuário provavelmente não escolheu.
 */
const DeviationBadge = ({ kind, relatedName, className }: DeviationBadgeProps) => (
    <span
        className={cn(
            "text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded-full border shrink-0",
            kind === "NOT_DONE"
                ? "text-muted-foreground bg-muted border-border"
                : "text-muted-foreground bg-muted/50 border-border/60",
            className
        )}
    >
        {DEVIATION_LABEL[kind]}
        {kind === "SUBSTITUTED" && relatedName ? ` ${relatedName}` : ""}
    </span>
);

export default DeviationBadge;
