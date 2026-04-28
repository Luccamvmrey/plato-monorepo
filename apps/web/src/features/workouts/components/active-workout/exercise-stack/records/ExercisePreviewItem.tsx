import type { EnrichedExerciseRecord } from "@/features/workouts/workout.types.ts";
import { MuscleBadge } from "@/core/components/MuscleBadge";

type ExercisePreviewItemProps = {
    record: EnrichedExerciseRecord;
};

const ExercisePreviewItem = ({ record }: ExercisePreviewItemProps) => {
    return (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border opacity-50">
            <span className="text-[13px] font-medium text-foreground flex-1">
                {record.exercise.name}
            </span>
            <MuscleBadge muscle={record.exercise.targetMuscle} />
            <span className="text-[12px] text-muted-foreground">
                {record.targetSets} × {record.targetReps}
            </span>
        </div>
    );
};

export default ExercisePreviewItem;
