import type { KeyboardEvent } from "react";
import { cn } from "@/lib/utils.ts";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Trash2, GripVertical } from "lucide-react";
import DeletionAlertDialog from "@/core/components/DeletionAlertDialog.tsx";
import { focusNextField } from "@/core/utils/focus.ts";
import { type WorkoutExerciseDraft } from "@/features/workouts/stores/workout-editor.store.ts";
import { useExerciseItemLogic } from "@/features/workouts/hooks/useExerciseItemLogic.ts";

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

type ExerciseItemProps = {
    exercise: WorkoutExerciseDraft;
};

const ExerciseItem = ({ exercise }: ExerciseItemProps) => {
    const {
        onEditSets,
        onEditReps,
        removeExercise,
        attributes,
        listeners,
        setNodeRef,
        style,
        isDragging,
    } = useExerciseItemLogic(exercise);

    return (
        <div
            ref={setNodeRef}
            style={style}
            data-instance-id={exercise.instanceId}
            className={cn(
                "flex flex-row items-center justify-between gap-2 px-3 py-3 rounded-xl border border-border bg-card shadow-none transition-all select-none w-full",
                isDragging && "opacity-50 ring-2 ring-primary/20 border-primary z-50 scale-[1.02]"
            )}
        >
            <div 
                {...attributes} 
                {...listeners} 
                className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-muted-foreground/50 hover:text-foreground transition-colors touch-none"
            >
                <GripVertical data-icon="inline" className="size-5" />
            </div>

            <span className="flex-1 font-medium tracking-tight text-foreground/90 py-1 text-sm">
                {exercise.exercise.name}
            </span>

            <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1 bg-muted/30 rounded-lg px-2 py-1">
                    <Input
                        type="number"
                        inputMode="numeric"
                        enterKeyHint="next"
                        min={1}
                        placeholder="0"
                        aria-label={`Séries — ${exercise.exercise.name}`}
                        data-editor-field="sets"
                        value={exercise.targetSets === 0 ? "" : exercise.targetSets}
                        onChange={(e) => onEditSets(exercise.instanceId, parseInt(e.target.value) || 0)}
                        onKeyDown={handleFieldKeyDown}
                        className="w-10 h-8 p-0 border-none bg-transparent text-center focus-visible:ring-0 font-medium tabular-nums"
                    />
                    <span className="text-[10px] font-bold text-muted-foreground/50 uppercase">s</span>
                </div>

                <div className="flex items-center gap-1 bg-muted/30 rounded-lg px-2 py-1">
                    <Input
                        type="number"
                        inputMode="numeric"
                        enterKeyHint="next"
                        min={1}
                        placeholder="0"
                        aria-label={`Repetições — ${exercise.exercise.name}`}
                        data-editor-field="reps"
                        value={exercise.targetReps === 0 ? "" : exercise.targetReps}
                        onChange={(e) => onEditReps(exercise.instanceId, parseInt(e.target.value) || 0)}
                        onKeyDown={handleFieldKeyDown}
                        className="w-10 h-8 p-0 border-none bg-transparent text-center focus-visible:ring-0 font-medium tabular-nums"
                    />
                    <span className="text-[10px] font-bold text-muted-foreground/50 uppercase">r</span>
                </div>
                <DeletionAlertDialog onConfirm={() => removeExercise(exercise.instanceId)}>
                    <Button variant="ghost" size="icon" aria-label={`Remover ${exercise.exercise.name}`} className="size-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                        <Trash2 data-icon="inline" className="size-4"/>
                    </Button>
                </DeletionAlertDialog>
            </div>
        </div>
    );
};

export default ExerciseItem;