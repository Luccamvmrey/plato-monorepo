import { cn } from "@/lib/utils.ts";
import { DEVIATION_LABEL, type DeviationKind } from "@/features/workouts/utils/session-deviation.ts";

type DeviationBadgeProps = {
    kind: DeviationKind;
    className?: string;
};

/**
 * Marcação neutra, sem cor de alerta: trocar ou pular exercício é decisão legítima do
 * treino, não erro a ser sinalizado. `NOT_DONE` é o único que ganha um tom próprio,
 * porque é o que o usuário provavelmente não escolheu.
 *
 * O badge NÃO carrega o nome do exercício relacionado. Ele é `shrink-0` numa linha em
 * que o nome do exercício é `flex-1 min-w-0 truncate` — ou seja, todo texto que entra
 * aqui é espaço tirado do nome, e "Substituiu Supino Inclinado com Halteres" chegou a
 * colapsar o nome para largura zero. Quem precisa do relacionado renderiza numa
 * segunda linha.
 */
const DeviationBadge = ({ kind, className }: DeviationBadgeProps) => (
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
    </span>
);

export default DeviationBadge;
