import { CheckCircle2, Plus } from "lucide-react";
import { useExerciseWeightInput } from "@/features/workouts/hooks/useExerciseWeightInput.ts";
import type { EnrichedExerciseRecord } from "@/features/workouts/workout.types.ts";
import { UNITS } from "@/core/constants/units.ts";
import ExerciseWeightField from "./ExerciseWeightField";

type SimpleCompletedExerciseCardProps = {
    record: EnrichedExerciseRecord;
    lastWeight?: number;
    onAddExtraSet?: () => void;
};

const SimpleCompletedExerciseCard = ({ record, lastWeight, onAddExtraSet }: SimpleCompletedExerciseCardProps) => {
    const { value, handleChange } = useExerciseWeightInput(record);

    return (
        <div className="flex flex-col gap-3 p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-success flex-shrink-0" />
                <span className="text-[13px] font-medium text-muted-foreground flex-1">
                    {record.exercise.name}
                </span>
                <span className="text-[11px] text-muted-foreground">
                    {record.logs.length} / {record.effectiveTargetSets}{" "}
                    {record.effectiveTargetSets === 1 ? UNITS.SINGLE_SET : UNITS.SETS}
                </span>
            </div>

            {record.exercise.loadType !== "BODYWEIGHT" && (
                <ExerciseWeightField
                    id={`weight-done-${record.exerciseId}`}
                    value={value}
                    onChange={handleChange}
                    lastWeight={lastWeight}
                />
            )}

            {onAddExtraSet && (
                <button
                    className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors self-start"
                    onClick={onAddExtraSet}
                >
                    <Plus className="size-3.5" />
                    Série extra
                </button>
            )}
        </div>
    );
};

export default SimpleCompletedExerciseCard;
