import { Badge } from "@/components/ui/badge";
import { MuscleGroup } from "@plato/database/generated/prisma/enums.ts";
import { muscleGroupTranslation } from "@/core/utils/translations.ts";
import { cn } from "@/lib/utils.ts";

const GROUPS = Object.values(MuscleGroup);

type FilterChipProps = {
    label: string;
    isSelected: boolean;
    onSelect: () => void;
};

/**
 * `Badge` renderiza um <span> por padrão, então o onClick ficava num elemento não
 * focável — os filtros inteiros eram inalcançáveis por teclado e apareciam como
 * StaticText na árvore de acessibilidade. `asChild` troca o span por um <button>
 * real sem perder o estilo do badge.
 *
 * `overflow-visible` é obrigatório junto do `.tap-target`: o badge base traz
 * `overflow-hidden`, que recortaria o ::after de 44px.
 */
const FilterChip = ({ label, isSelected, onSelect }: FilterChipProps) => (
    <Badge
        asChild
        variant={isSelected ? "default" : "secondary"}
        className={cn(
            "cursor-pointer whitespace-nowrap px-4 py-2 rounded-full font-medium transition-colors border border-transparent shadow-none",
            "relative tap-target overflow-visible",
            !isSelected && "bg-muted/50 text-muted-foreground hover:bg-muted"
        )}
    >
        <button type="button" aria-pressed={isSelected} onClick={onSelect}>
            {label}
        </button>
    </Badge>
);

type MuscleGroupFilterProps = {
    selectedMuscleGroup: string;
    onSelectMuscleGroup: (muscleGroup: string) => void;
};

const MuscleGroupFilter = ({ selectedMuscleGroup, onSelectMuscleGroup }: MuscleGroupFilterProps) => {
    return (
        // py-3, não py-1: `overflow-x-auto` faz o eixo Y computar para `auto`
        // também, então este container RECORTA. Com 4px de padding o ::after de
        // 44px do .tap-target era cortado e o alvo continuava valendo 20px —
        // medido: um probe 16px acima do chip não acertava o chip.
        <div
            role="group"
            aria-label="Filtrar por grupo muscular"
            className="flex gap-2 overflow-x-auto no-scrollbar py-3"
        >
            <FilterChip
                label="Todos"
                isSelected={selectedMuscleGroup === "ALL"}
                onSelect={() => onSelectMuscleGroup("ALL")}
            />

            {GROUPS.map((group) => (
                <FilterChip
                    key={group}
                    label={muscleGroupTranslation[group] || group}
                    isSelected={selectedMuscleGroup === group}
                    onSelect={() => onSelectMuscleGroup(group)}
                />
            ))}
        </div>
    );
};

export default MuscleGroupFilter;
