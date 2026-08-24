import type { KeyboardEvent } from "react";
import { cn } from "@/lib/utils.ts";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Trash2, GripVertical, Link2 } from "lucide-react";
import type { GroupMembership } from "@plato/shared";
import DeletionAlertDialog from "@/core/components/DeletionAlertDialog.tsx";
import { focusNextField } from "@/core/utils/focus.ts";
import { type WorkoutExerciseDraft } from "@/features/workouts/stores/workout-editor.store.ts";
import { useExerciseItemLogic } from "@/features/workouts/hooks/useExerciseItemLogic.ts";
import ExerciseGroupChip from "@/features/workouts/components/workout-editor/exercise-list/ExerciseGroupChip.tsx";

/**
 * The submit button lives outside the <form> and is re-associated via `form={id}`,
 * which enables implicit submission from every input in the editor. Enter therefore
 * has to be intercepted, or filling in sets/reps submits a half-finished workout.
 */
const handleFieldKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (!focusNextField(e.currentTarget)) e.currentTarget.blur();
};

type TargetFieldProps = {
    field: "sets" | "reps";
    suffix: string;
    label: string;
    value: number;
    onChange: (value: number) => void;
};

/**
 * Séries e repetições eram dois blocos idênticos de 15 linhas.
 *
 * Os dois inputs são os únicos alvos de toque que não podem usar `.tap-target`:
 * `<input>` é elemento substituído e não renderiza `::after`, então a área tem
 * que crescer de verdade — `size-11` = 44px, contra os 40 × 32px anteriores.
 */
const TargetField = ({ field, suffix, label, value, onChange }: TargetFieldProps) => (
    <div className="flex items-center gap-1 bg-muted/30 rounded-lg pr-2">
        <Input
            type="number"
            inputMode="numeric"
            enterKeyHint="next"
            min={1}
            placeholder="0"
            aria-label={label}
            data-editor-field={field}
            value={value === 0 ? "" : value}
            onChange={(e) => onChange(parseInt(e.target.value) || 0)}
            onKeyDown={handleFieldKeyDown}
            className="size-11 p-0 border-none bg-transparent text-center focus-visible:ring-0 font-medium tabular-nums"
        />
        <span className="text-[10px] font-bold text-muted-foreground/50 uppercase">{suffix}</span>
    </div>
);

type ExerciseItemProps = {
    exercise: WorkoutExerciseDraft;
    /** `null` quando o exercício não faz parte de nenhum grupo. */
    membership: GroupMembership | null;
    /** Falso no último da lista: não há com quem emendar. */
    canGroupWithNext: boolean;
};

const ExerciseItem = ({ exercise, membership, canGroupWithNext }: ExerciseItemProps) => {
    const {
        onEditSets,
        onEditReps,
        removeExercise,
        groupWithNext,
        ungroup,
        attributes,
        listeners,
        setNodeRef,
        style,
        isDragging,
    } = useExerciseItemLogic(exercise);

    // Fundo `muted` em vez de borda esquerda colorida: DESIGN_SYSTEM §9 lista
    // `border-l-4` em card como padrão a não repetir.
    const grouped = membership !== null;

    /**
     * Membros de um grupo viram um bloco só: `-mt-2` cancela o `gap-2` da lista e os
     * cards se encostam, com as bordas adjacentes formando o divisor. Dois cards
     * idênticos separados por espaço não diziam qual estava combinado com qual —
     * era a queixa do print.
     */
    const shape = !grouped ? "rounded-xl"
        : membership.isFirst ? "rounded-t-xl rounded-b-none"
        : membership.isLast ? "rounded-b-xl rounded-t-none -mt-2"
        : "rounded-none -mt-2";

    return (
        <div
            ref={setNodeRef}
            style={style}
            data-instance-id={exercise.instanceId}
            className={cn(
                "flex flex-col gap-2 px-3 py-3 border border-border shadow-none transition-all select-none w-full",
                shape,
                grouped ? "bg-muted/40" : "bg-card",
                // Arrastar tira o card do bloco: sem soltar o `-mt-2` e os cantos, ele
                // continuaria desenhado como se estivesse colado a um vizinho do qual
                // já se afastou.
                isDragging && "opacity-50 ring-2 ring-primary/20 border-primary z-50 scale-[1.02] rounded-xl mt-0"
            )}
        >
            {/* Cabeçalho do grupo: abre o bloco, antes dos membros. */}
            {membership?.isFirst && (
                <ExerciseGroupChip
                    groupType={membership.groupType}
                    size={membership.size}
                    onUngroup={() => ungroup(exercise.instanceId)}
                />
            )}

            <div className="flex flex-row items-center justify-between gap-2 w-full">
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-muted-foreground/50 hover:text-foreground transition-colors touch-none relative tap-target"
                >
                    <GripVertical data-icon="inline" className="size-5" />
                </div>

                <span className="flex-1 font-medium tracking-tight text-foreground/90 py-1 text-sm">
                    {/* Posição dentro do grupo: com os cards colados, é ela que diz
                        "este é o segundo do par", sem precisar contar. */}
                    {membership && (
                        <span className="text-muted-foreground tabular-nums mr-1.5">
                            {membership.position + 1}/{membership.size}
                        </span>
                    )}
                    {exercise.exercise.name}
                </span>

                <div className="flex items-center gap-2 shrink-0">
                    <TargetField
                        field="sets"
                        suffix="s"
                        label={`Séries — ${exercise.exercise.name}`}
                        value={exercise.targetSets}
                        onChange={(next) => onEditSets(exercise.instanceId, next)}
                    />

                    <TargetField
                        field="reps"
                        suffix="r"
                        label={`Repetições — ${exercise.exercise.name}`}
                        value={exercise.targetReps}
                        onChange={(next) => onEditReps(exercise.instanceId, next)}
                    />

                    {/* Sempre "emenda com o de baixo" — é assim que um bi-set vira
                        tri-set. Só some no último, onde não há próximo. */}
                    {canGroupWithNext && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => groupWithNext(exercise.instanceId)}
                            aria-label={`Agrupar ${exercise.exercise.name} com o próximo exercício`}
                            className="size-9 text-muted-foreground hover:text-foreground relative tap-target"
                        >
                            <Link2 data-icon="inline" className="size-4" />
                        </Button>
                    )}

                    <DeletionAlertDialog onConfirm={() => removeExercise(exercise.instanceId)}>
                        <Button variant="ghost" size="icon" aria-label={`Remover ${exercise.exercise.name}`} className="size-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 relative tap-target">
                            <Trash2 data-icon="inline" className="size-4"/>
                        </Button>
                    </DeletionAlertDialog>
                </div>
            </div>
        </div>
    );
};

export default ExerciseItem;