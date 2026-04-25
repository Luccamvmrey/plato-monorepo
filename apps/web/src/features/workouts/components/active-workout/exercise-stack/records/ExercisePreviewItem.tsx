import type { EnrichedExerciseRecord } from "@/features/workouts/workout.types.ts";
import { Dumbbell } from "lucide-react";

type ExercisePreviewItemProps = {
    record: EnrichedExerciseRecord
};

const ExercisePreviewItem = ({ record }: ExercisePreviewItemProps) => {
    return (
        <div className="flex items-center gap-3 p-4 bg-transparent border-2 border-primary border-dashed rounded-xl">
            <div className="flex items-center justify-center size-8 rounded-full bg-primary text-secondary-foreground">
                <Dumbbell className="size-4" />
            </div>

            <span className="font-medium text-muted-foreground">
                {record.exercise.name}
            </span>

            <div className="ml-auto flex items-center gap-1.5 text-sm text--foreground tabular-nums bg-primary px-2 py-1 rounded-md">
                <span className="font-medium">{record.targetSets}</span>
                <span className="text-xs">x</span>
                <span className="font-medium">{record.targetReps}</span>
            </div>
        </div>
    );
};

export default ExercisePreviewItem;