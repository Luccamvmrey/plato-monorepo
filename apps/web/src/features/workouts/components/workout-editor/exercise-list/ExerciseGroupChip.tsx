import { Link2, X } from "lucide-react";
import { GROUP_TYPE_DESCRIPTION, GROUP_TYPE_LABEL } from "@/features/workouts/utils/movement.ts";

type ExerciseGroupChipProps = {
    groupType: string;
    size: number;
    onUngroup: () => void;
};

/**
 * Cabeçalho do grupo, no topo do PRIMEIRO membro — um por grupo, não por exercício.
 *
 * Fica no topo, e não no rodapé, porque é o que abre o bloco: os membros aparecem
 * embaixo dele, colados, e a leitura fica "este grupo contém estes dois". No rodapé
 * o chip parecia pertencer ao exercício de cima e não ao par.
 *
 * Só existe "bi-set" hoje — o rótulo é estático, não um toggle. Um grupo antigo salvo
 * como `REST_PAUSE` ainda exibe o rótulo certo (fallback abaixo), só não dá mais pra
 * criar um novo assim.
 */
const ExerciseGroupChip = ({ groupType, size, onUngroup }: ExerciseGroupChipProps) => (
    <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
            <Link2 data-icon="inline" className="size-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
            <span
                title={GROUP_TYPE_DESCRIPTION[groupType]}
                aria-label={`Tipo do grupo: ${GROUP_TYPE_LABEL[groupType] ?? groupType}. ${GROUP_TYPE_DESCRIPTION[groupType] ?? ""}`}
                className="rounded-sm bg-secondary text-secondary-foreground px-2 py-0.5 text-[11px] font-medium tracking-[0.04em] uppercase"
            >
                {GROUP_TYPE_LABEL[groupType] ?? groupType}
            </span>
            <span className="text-[11px] text-muted-foreground truncate">
                {size} exercícios, uma série de cada
            </span>
        </div>

        <button
            type="button"
            onClick={onUngroup}
            aria-label="Desfazer agrupamento"
            className="relative tap-target text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
            <X data-icon="inline" className="size-3.5" />
        </button>
    </div>
);

export default ExerciseGroupChip;
