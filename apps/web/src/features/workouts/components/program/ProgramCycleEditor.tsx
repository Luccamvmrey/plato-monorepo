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

const HEADING = "text-[17px] font-semibold tracking-[-0.02em] px-1";
const ICON_BUTTON = "size-9 text-muted-foreground relative tap-target";

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
            <h2 className={HEADING}>Ordem da rotação</h2>

            {selectedWorkouts.length === 0 ? (
                <p className="text-[14px] text-muted-foreground px-1 py-2">
                    Nenhum treino no programa ainda. Adicione abaixo.
                </p>
            ) : (
                <ol className="flex flex-col gap-2">
                    {selectedWorkouts.map((workout, index) => (
                        <li key={workout.id} className="flex items-center gap-2 p-3 rounded-xl border border-border bg-card">
                            <span className="size-7 rounded-md bg-muted text-muted-foreground flex items-center justify-center text-[13px] font-medium tabular-nums shrink-0">
                                {index + 1}
                            </span>
                            {/* Até duas linhas: com três botões ao lado, cortar em uma
                                escondia a parte do nome que diferencia os treinos. */}
                            <span className="flex-1 min-w-0 text-[14px] font-medium leading-snug line-clamp-2">
                                {workout.name}
                            </span>

                            <div className="flex items-center gap-2 shrink-0">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={ICON_BUTTON}
                                    onClick={() => onMove(index, -1)}
                                    disabled={index === 0}
                                    aria-label={`Mover ${workout.name} para cima`}
                                >
                                    <ArrowUp data-icon="inline" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={ICON_BUTTON}
                                    onClick={() => onMove(index, 1)}
                                    disabled={index === selectedWorkouts.length - 1}
                                    aria-label={`Mover ${workout.name} para baixo`}
                                >
                                    <ArrowDown data-icon="inline" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={ICON_BUTTON}
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
            <h2 className={HEADING}>Adicionar treino</h2>

            {availableWorkouts.length === 0 ? (
                <p className="text-[14px] text-muted-foreground px-1 py-2">
                    Todos os seus treinos ativos já estão no programa.
                </p>
            ) : (
                <ul className="flex flex-col gap-2">
                    {availableWorkouts.map((workout) => (
                        <li key={workout.id}>
                            <button
                                type="button"
                                onClick={() => onAdd(workout.id)}
                                className="w-full min-h-12 flex items-center gap-3 p-3 rounded-xl border border-dashed border-border text-left transition-colors hover:bg-muted/40"
                            >
                                <Plus className="size-4 text-muted-foreground shrink-0" />
                                <span className="flex-1 min-w-0 truncate text-[14px]">{workout.name}</span>
                                <span className="text-[13px] text-muted-foreground tabular-nums shrink-0">
                                    {workout.workoutExercise.length} {workout.workoutExercise.length === 1 ? "exercício" : "exercícios"}
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
