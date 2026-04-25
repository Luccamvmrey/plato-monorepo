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
                "flex flex-row items-center justify-between gap-2 font-light px-2 py-3 rounded-lg border bg-card transition-shadow select-none w-full",
                isDragging && "opacity-50 shadow-xl border-primary z-50 scale-105"
            )}
        >
            <div 
                {...attributes} 
                {...listeners} 
                className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors touch-none"
            >
                <GripVertical className="size-5" />
            </div>
            
            <span className="flex-1 truncate">{exercise.exercise.name}</span>
            <div className="flex items-center gap-2">
                <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="Sets"
                    value={exercise.targetSets}
                    onChange={(e) => onEditSets(exercise.instanceId, parseInt(e.target.value))}
                    className="w-[60px]"
                />
                <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="Reps"
                    value={exercise.targetReps}
                    onChange={(e) => onEditReps(exercise.instanceId, parseInt(e.target.value))}
                    className="w-[60px]"
                />
                <DeletionAlertDialog onConfirm={() => removeExercise(exercise.instanceId)}>
                    <Button variant="ghost" size="icon-sm">
                        <Trash2 className="text-destructive"/>
                    </Button>
                </DeletionAlertDialog>
            </div>
        </div>
    );
};

export default ExerciseItem;