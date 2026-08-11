import { Link2, X } from "lucide-react";
import { EXERCISE_GROUP_TYPES, type ExerciseGroupTypeValue } from "@plato/shared";
import { GROUP_TYPE_DESCRIPTION, GROUP_TYPE_LABEL } from "@/features/workouts/utils/movement.ts";

type ExerciseGroupChipProps = {
    groupType: string;
    size: number;
    onCycleType: (next: ExerciseGroupTypeValue) => void;
    onUngroup: () => void;
};

const nextType = (current: string): ExerciseGroupTypeValue => {
    const index = EXERCISE_GROUP_TYPES.indexOf(current as ExerciseGroupTypeValue);
    return EXERCISE_GROUP_TYPES[(index + 1) % EXERCISE_GROUP_TYPES.length];
};

/**
 * Cabeçalho do grupo, no topo do PRIMEIRO membro — um por grupo, não por exercício.
 *
 * Fica no topo, e não no rodapé, porque é o que abre o bloco: os membros aparecem
 * embaixo dele, colados, e a leitura fica "este grupo contém estes dois". No rodapé
 * o chip parecia pertencer ao exercício de cima e não ao par.
 *
 * O tipo cicla no toque em vez de abrir um select: são duas opções, e um `Select`
 * aqui abriria um popover sobre uma lista que o usuário está arrastando.
 */
const ExerciseGroupChip = ({ groupType, size, onCycleType, onUngroup }: ExerciseGroupChipProps) => (
    <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
            <Link2 data-icon="inline" className="size-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
            <button
                type="button"
                onClick={() => onCycleType(nextType(groupType))}
                title={GROUP_TYPE_DESCRIPTION[groupType]}
                aria-label={`Tipo do grupo: ${GROUP_TYPE_LABEL[groupType]}. ${GROUP_TYPE_DESCRIPTION[groupType]}. Toque para alternar.`}
                className="relative tap-target rounded-sm bg-secondary text-secondary-foreground px-2 py-0.5 text-[11px] font-medium tracking-[0.04em] uppercase"
            >
                {GROUP_TYPE_LABEL[groupType] ?? groupType}
            </button>
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
