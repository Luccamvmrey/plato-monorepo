import type { EnrichedExerciseRecord } from "@/features/workouts/workout.types.ts";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils.ts";

type ExerciseHeaderMinimizedProps = {
    record: EnrichedExerciseRecord;
    onClick?: () => void;
};

const ExerciseHeaderMinimized = ({ record, onClick }: ExerciseHeaderMinimizedProps) => {
    return (
        <div 
            className={cn(
                "flex items-center gap-3 p-4 bg-card border rounded-xl opacity-60 transition-all active:scale-[0.98]",
                onClick && "cursor-pointer hover:opacity-100 hover:bg-muted/30"
            )}
            onClick={onClick}
        >
            <CheckCircle2 className="size-5 text-emerald-500" />

            <span className="font-medium text-muted-foreground line-through decoration-muted-foreground/40">
                {record.exercise.name}
            </span>

            <div className="ml-auto text-xs text-muted-foreground tabular-nums font-medium">
                {record.logs.length} / {record.targetSets} séries
            </div>
        </div>
    );
};

export default ExerciseHeaderMinimized;
