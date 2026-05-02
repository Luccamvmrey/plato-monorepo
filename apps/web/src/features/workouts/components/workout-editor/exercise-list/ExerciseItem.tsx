import { cn } from "@/lib/utils.ts";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Trash2, GripVertical } from "lucide-react";
import DeletionAlertDialog from "@/core/components/DeletionAlertDialog.tsx";
import { type WorkoutExerciseDraft } from "@/features/workouts/stores/workout-editor.store.ts";
import { useExerciseItemLogic } from "@/features/workouts/hooks/useExerciseItemLogic.ts";

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
                        min={1}
                        placeholder="0"
                        value={exercise.targetSets === 0 ? "" : exercise.targetSets}
                        onChange={(e) => onEditSets(exercise.instanceId, parseInt(e.target.value) || 0)}
                        className="w-10 h-8 p-0 border-none bg-transparent text-center focus-visible:ring-0 font-medium tabular-nums"
                    />
                    <span className="text-[10px] font-bold text-muted-foreground/50 uppercase">s</span>
                </div>

                <div className="flex items-center gap-1 bg-muted/30 rounded-lg px-2 py-1">
                    <Input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        placeholder="0"
                        value={exercise.targetReps === 0 ? "" : exercise.targetReps}
                        onChange={(e) => onEditReps(exercise.instanceId, parseInt(e.target.value) || 0)}
                        className="w-10 h-8 p-0 border-none bg-transparent text-center focus-visible:ring-0 font-medium tabular-nums"
                    />
                    <span className="text-[10px] font-bold text-muted-foreground/50 uppercase">r</span>
                </div>
                <DeletionAlertDialog onConfirm={() => removeExercise(exercise.instanceId)}>
                    <Button variant="ghost" size="icon" className="size-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                        <Trash2 data-icon="inline" className="size-4"/>
                    </Button>
                </DeletionAlertDialog>
            </div>
        </div>
    );
};

export default ExerciseItem;