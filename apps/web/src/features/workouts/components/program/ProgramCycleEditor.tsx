import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import type { Workout } from "@/features/workouts/workout.types.ts";

type ProgramCycleEditorProps = {
    selectedWorkouts: Workout[];
    availableWorkouts: Workout[];
    onAdd: (workoutId: number) => void;
    onRemove: (workoutId: number) => void;
    onMove: (index: number, direction: -1 | 1) => void;
};

/**
 * Ordenação por setas, não por drag and drop.
 *
 * O editor de treino usa dnd-kit porque lá a lista tem 6–14 itens e o arrasto é o
 * gesto natural. Aqui são 3–6 treinos, e seta tem duas vantagens que importam mais
 * que a elegância do arrasto: funciona com teclado e leitor de tela sem trabalho
 * extra, e não disputa o scroll vertical da página no toque.
 */
const ProgramCycleEditor = ({
    selectedWorkouts,
    availableWorkouts,
    onAdd,
    onRemove,
    onMove,
}: ProgramCycleEditorProps) => (
    <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
            <h2 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground px-1">
                Ordem da rotação
            </h2>

            {selectedWorkouts.length === 0 ? (
                <p className="text-[13px] text-muted-foreground px-1 py-3">
                    Nenhum treino no programa ainda. Adicione abaixo.
                </p>
            ) : (
                <ol className="flex flex-col gap-2">
                    {selectedWorkouts.map((workout, index) => (
                        <li
                            key={workout.id}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-card"
                        >
                            <span className="text-xs font-medium text-muted-foreground tabular-nums w-4 shrink-0">
                                {index + 1}
                            </span>
                            <span className="flex-1 truncate text-sm tracking-tight">
                                {workout.name}
                            </span>

                            <div className="flex items-center gap-2 shrink-0">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-9 text-muted-foreground relative tap-target"
                                    onClick={() => onMove(index, -1)}
                                    disabled={index === 0}
                                    aria-label={`Mover ${workout.name} para cima`}
                                >
                                    <ArrowUp data-icon="inline" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-9 text-muted-foreground relative tap-target"
                                    onClick={() => onMove(index, 1)}
                                    disabled={index === selectedWorkouts.length - 1}
                                    aria-label={`Mover ${workout.name} para baixo`}
                                >
                                    <ArrowDown data-icon="inline" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-9 text-muted-foreground relative tap-target"
                                    onClick={() => onRemove(workout.id)}
                                    aria-label={`Remover ${workout.name} do programa`}
                                >
                                    <X data-icon="inline" />
                                </Button>
                            </div>
                        </li>
                    ))}
                </ol>
            )}
        </div>

        <div className="flex flex-col gap-2">
            <h2 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground px-1">
                Treinos disponíveis
            </h2>

            {availableWorkouts.length === 0 ? (
                <p className="text-[13px] text-muted-foreground px-1 py-3">
                    Todos os seus treinos ativos já estão no programa.
                </p>
            ) : (
                <ul className="flex flex-col gap-2">
                    {availableWorkouts.map((workout) => (
                        <li key={workout.id}>
                            <button
                                onClick={() => onAdd(workout.id)}
                                className="w-full flex items-center gap-2 px-3 py-3 rounded-xl border border-dashed border-border text-left transition-colors hover:bg-muted/40"
                            >
                                <Plus className="w-4 h-4 text-muted-foreground shrink-0" />
                                <span className="flex-1 truncate text-sm tracking-tight">
                                    {workout.name}
                                </span>
                                <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                                    {workout.workoutExercise.length} ex.
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    </div>
);

export default ProgramCycleEditor;
