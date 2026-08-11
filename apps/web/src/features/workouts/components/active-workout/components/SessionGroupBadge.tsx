import { Link2 } from "lucide-react";
import type { GroupMembership } from "@plato/shared";
import { cn } from "@/lib/utils.ts";
import { GROUP_TYPE_DESCRIPTION, GROUP_TYPE_LABEL } from "@/features/workouts/utils/movement.ts";

type SessionGroupBadgeProps = {
    group: GroupMembership | null;
    className?: string;
};

/**
 * Marca que o exercício faz parte de um bi-set/tri-set, durante a sessão.
 *
 * Mostra a posição (`1/2`) porque é ela que responde a pergunta prática no meio do
 * treino: "já emendei o outro ou ainda falta?". A ordem de execução das séries
 * continua a mesma — este badge informa, não muda a mecânica da tela.
 */
const SessionGroupBadge = ({ group, className }: SessionGroupBadgeProps) => {
    if (!group) return null;

    const label = GROUP_TYPE_LABEL[group.groupType] ?? group.groupType;

    return (
        <span
            title={GROUP_TYPE_DESCRIPTION[group.groupType]}
            aria-label={`${label}, exercício ${group.position + 1} de ${group.size}`}
            className={cn(
                "inline-flex items-center gap-1 rounded-sm bg-secondary text-secondary-foreground px-2 py-0.5",
                "text-[11px] font-medium tracking-[0.04em] uppercase",
                className
            )}
        >
            <Link2 data-icon="inline" className="size-3" aria-hidden="true" />
            {label} {group.position + 1}/{group.size}
        </span>
    );
};

export default SessionGroupBadge;
