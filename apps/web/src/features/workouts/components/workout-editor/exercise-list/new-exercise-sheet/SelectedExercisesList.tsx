import type { Exercise } from "@/features/workouts/workout.types.ts";
import { Badge } from "@/components/ui/badge.tsx";
import { X } from "lucide-react";

type SelectedExercisesListProps = {
    selectedExercises: Exercise[];
    onExerciseClick: (exercise: Exercise) => void;
};

const SelectedExercisesList = ({ selectedExercises, onExerciseClick }: SelectedExercisesListProps) => {
    if (selectedExercises.length === 0) return null;

    return (
        // shrink-0 é obrigatório: `overflow-x-auto` faz desta linha um scroll container,
        // cujo tamanho mínimo automático é 0 (e não o do conteúdo). Como irmã de uma
        // lista muito mais alta que a viewport dentro de um flex-col, ela era esmagada
        // para height:0.
        //
        // px-6 porque esta linha vive FORA da área rolável (que tem o padding próprio):
        // dentro dela os chips ficavam permanentemente acima da posição de rolagem.
        //
        // py-3 pelo mesmo motivo, do outro lado: `overflow-x-auto` faz o eixo Y
        // computar para `auto` também, então esta linha RECORTA. Sem folga
        // vertical o ::after de 44px do .tap-target era cortado e o alvo
        // continuava valendo os 20px do badge.
        <div
            role="list"
            aria-label="Exercícios selecionados"
            className="flex gap-2 overflow-x-auto no-scrollbar shrink-0 py-3 px-6 border-b border-border/50 bg-background"
        >
            {selectedExercises.map((exercise) => (
                // asChild: o Badge é um <span>, então o chip de remoção não era
                // focável nem anunciado — e o X sozinho não dizia o que removia.
                // overflow-visible libera o ::after de 44px do .tap-target, que o
                // overflow-hidden do badge recortaria.
                <Badge
                    key={exercise.id}
                    asChild
                    role="listitem"
                    className="relative tap-target overflow-visible cursor-pointer"
                >
                    <button
                        type="button"
                        aria-label={`Remover ${exercise.name}`}
                        onClick={() => onExerciseClick(exercise)}
                    >
                        {exercise.name}
                        <X aria-hidden="true"/>
                    </button>
                </Badge>
            ))}
        </div>
    );
};

export default SelectedExercisesList;