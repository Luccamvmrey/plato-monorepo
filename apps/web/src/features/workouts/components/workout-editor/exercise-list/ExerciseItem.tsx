import type { KeyboardEvent } from "react";
import { cn } from "@/lib/utils.ts";
import { Button } from "@/components/ui/button.tsx";
import { Trash2, GripVertical, Link2, Minus, Plus } from "lucide-react";
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

type TargetStepperProps = {
    field: "sets" | "reps";
    caption: string;
    label: string;
    value: number;
    onChange: (value: number) => void;
};

const STEP_BUTTON = "h-12 w-11 shrink-0 flex items-center justify-center text-muted-foreground hover:text-foreground active:bg-accent transition-colors";

/**
 * Ajustar séries e reps é um toque na maior parte das vezes: ir de 3 para 4 não precisa
 * abrir o teclado. O número continua editável, para saltos maiores.
 */
const TargetStepper = ({ field, caption, label, value, onChange }: TargetStepperProps) => (
    <div className="flex-1 min-w-0 flex items-center rounded-lg bg-muted">
        <button
            type="button"
            aria-label={`Diminuir: ${label}`}
            onClick={() => onChange(Math.max(1, value - 1))}
            className={cn(STEP_BUTTON, "rounded-l-lg")}
        >
            <Minus className="size-4" />
        </button>
        {/* <label> para o toque na legenda também focar: a área do campo são os 48px. */}
        <label className="flex-1 min-w-0 h-12 flex flex-col items-center justify-center cursor-text">
            {/* 16px ou mais: abaixo disso o iOS dá zoom ao focar. */}
            <input
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
                className="w-full bg-transparent text-center text-[17px] font-semibold leading-5 tabular-nums outline-none
                           [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="text-[11px] leading-3.5 text-muted-foreground">{caption}</span>
        </label>
        <button
            type="button"
            aria-label={`Aumentar: ${label}`}
            onClick={() => onChange(value + 1)}
            className={cn(STEP_BUTTON, "rounded-r-lg")}
        >
            <Plus className="size-4" />
        </button>
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
                "flex flex-col gap-2 p-3 border border-border bg-card shadow-none transition-all select-none w-full",
                shape,
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

            <div className="flex items-center gap-1 w-full min-h-9">
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors touch-none relative tap-target"
                >
                    <GripVertical data-icon="inline" className="size-5" />
                </div>

                {/* A linha inteira é do nome: antes ele dividia espaço com os campos e
                    "Supino Inclinado com Halteres" quebrava em quatro linhas. */}
                <span className="flex-1 min-w-0 text-[15px] font-medium tracking-[-0.01em] leading-snug text-foreground">
                    {/* Posição dentro do grupo: com os cards colados, é ela que diz
                        "este é o segundo do par", sem precisar contar. */}
                    {membership && (
                        <span className="text-muted-foreground tabular-nums mr-1.5">
                            {membership.position + 1}/{membership.size}
                        </span>
                    )}
                    {exercise.exercise.name}
                </span>

                {/* Sempre "emenda com o de baixo" — é assim que um bi-set vira
                    tri-set. Só some no último, onde não há próximo. */}
                {canGroupWithNext && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => groupWithNext(exercise.instanceId)}
                        aria-label={`Agrupar ${exercise.exercise.name} com o próximo exercício`}
                        className="size-9 shrink-0 text-muted-foreground hover:text-foreground relative tap-target"
                    >
                        <Link2 data-icon="inline" className="size-4" />
                    </Button>
                )}

                <DeletionAlertDialog onConfirm={() => removeExercise(exercise.instanceId)}>
                    <Button variant="ghost" size="icon" aria-label={`Remover ${exercise.exercise.name}`} className="size-9 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 relative tap-target">
                        <Trash2 data-icon="inline" className="size-4"/>
                    </Button>
                </DeletionAlertDialog>
            </div>

            <div className="flex gap-2">
                <TargetStepper
                    field="sets"
                    caption="séries"
                    label={`Séries — ${exercise.exercise.name}`}
                    value={exercise.targetSets}
                    onChange={(next) => onEditSets(exercise.instanceId, next)}
                />
                <TargetStepper
                    field="reps"
                    caption={exercise.exercise.repUnit === "SECONDS" ? "segundos" : "reps"}
                    label={`Repetições — ${exercise.exercise.name}`}
                    value={exercise.targetReps}
                    onChange={(next) => onEditReps(exercise.instanceId, next)}
                />
            </div>
        </div>
    );
};

export default ExerciseItem;
