import type { Exercise } from "@/features/workouts/workout.types.ts";
import { MuscleGroup } from "@plato/database/generated/prisma/enums.ts";
import { muscleGroupTranslation } from "@/core/utils/translations.ts";
import { cn } from "@/lib/utils.ts";
import { SearchX } from "lucide-react";
import { MuscleBadge } from "@/core/components/MuscleBadge.tsx";
import { memo, useMemo } from "react";

const GROUPS = Object.values(MuscleGroup);

type SheetExerciseListProps = {
    exercises: Exercise[]
    selectedExercises: Exercise[];
    onExerciseClick: (exercise: Exercise) => void;
};

type ExerciseRowProps = {
    exercise: Exercise;
    isSelected: boolean;
    onExerciseClick: (exercise: Exercise) => void;
};

/**
 * Era um <div onClick>: não focável, sem estado de seleção anunciado — as ~100
 * linhas do picker apareciam como StaticText na árvore de acessibilidade.
 *
 * memo() aqui é o que faz a busca não reconciliar a lista inteira a cada tecla;
 * depende de `onExerciseClick` ter identidade estável (useCallback no hook).
 */
const ExerciseRow = memo(({ exercise, isSelected, onExerciseClick }: ExerciseRowProps) => (
    <li>
        <button
            type="button"
            aria-pressed={isSelected}
            onClick={() => onExerciseClick(exercise)}
            className={cn(
                "w-full flex items-center justify-between gap-4 rounded-xl p-3 px-4 text-left transition-all cursor-pointer border border-transparent",
                "outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                isSelected
                    ? "bg-primary/10 border-primary/20 text-primary"
                    : "bg-muted/30 hover:bg-muted/50 text-foreground"
            )}
        >
            <span className="font-medium tracking-tight leading-tight flex-1 text-sm">
                {exercise.name}
            </span>
            <MuscleBadge
                muscle={exercise.targetMuscle}
                className={cn("scale-90 origin-right shrink-0", isSelected && "bg-primary/20 text-primary")}
            />
        </button>
    </li>
));
ExerciseRow.displayName = "ExerciseRow";

const SheetExerciseList = ({ exercises, selectedExercises, onExerciseClick }: SheetExerciseListProps) => {
    // Sem memo isto era um scan de 14 × N a cada tecla digitada na busca, em cima
    // do filtro que o hook já refaz.
    const groupedExercises = useMemo(
        () => GROUPS
            .map((group) => ({
                group,
                exercises: exercises.filter(exercise => exercise.targetMuscle === group),
            }))
            .filter(({ exercises: groupExercises }) => groupExercises.length > 0),
        [exercises]
    );

    // Set em vez de selectedExercises.some(): O(1) por linha em vez de
    // O(linhas × selecionados) a cada render.
    const selectedIds = useMemo(
        () => new Set(selectedExercises.map(exercise => exercise.id)),
        [selectedExercises]
    );

    // Cada grupo retorna null quando está vazio, então uma busca sem resultado
    // renderizava uma área totalmente em branco.
    if (exercises.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <SearchX className="w-8 h-8 text-muted-foreground opacity-20" />
                <p className="text-[13px] text-muted-foreground">
                    Nenhum exercício encontrado
                </p>
                <p className="text-[12px] text-muted-foreground/70">
                    Tente outro termo ou troque o filtro de músculo.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {groupedExercises.map(({ group, exercises: groupExercises }) => (
                <div key={group} className="flex flex-col gap-2">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">
                        {muscleGroupTranslation[group]}
                    </h3>

                    <ul className="flex flex-col gap-1">
                        {groupExercises.map((gExercise) => (
                            <ExerciseRow
                                key={gExercise.id}
                                exercise={gExercise}
                                isSelected={selectedIds.has(gExercise.id)}
                                onExerciseClick={onExerciseClick}
                            />
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
};

export default SheetExerciseList;
