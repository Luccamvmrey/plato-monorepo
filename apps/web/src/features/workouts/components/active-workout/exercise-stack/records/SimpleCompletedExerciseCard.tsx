import { useState } from "react";
import { CheckCircle2, ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { useExerciseWeightInput } from "@/features/workouts/hooks/useExerciseWeightInput.ts";
import { repLabelFor } from "@/features/workouts/hooks/useSimpleExerciseCardLogic.ts";
import { useActiveWorkoutStore } from "@/features/workouts/stores/active-workout.store.ts";
import { formatWeightPtBr } from "@/features/workouts/utils/progression.ts";
import type { EnrichedExerciseRecord } from "@/features/workouts/workout.types.ts";
import { UNITS } from "@/core/constants/units.ts";
import ExerciseWeightField from "./ExerciseWeightField";
import SetTiles from "./SetTiles";

type SimpleCompletedExerciseCardProps = {
    record: EnrichedExerciseRecord;
    lastWeight?: number;
    onAddExtraSet?: () => void;
};

/** Fechado é uma linha: o exercício acabou. Abrir serve para corrigir o que foi marcado. */
const SimpleCompletedExerciseCard = ({ record, lastWeight, onAddExtraSet }: SimpleCompletedExerciseCardProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const weight = useExerciseWeightInput(record, lastWeight);
    const undoLastSet = useActiveWorkoutStore((s) => s.undoLastSet);

    const usesLoad = record.exercise.loadType !== "BODYWEIGHT";
    const loggedWeight = record.logs[0]?.actualWeight;

    return (
        <div className="rounded-xl bg-card border border-border">
            <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setIsOpen((open) => !open)}
                className="w-full min-h-14 flex items-center gap-3 px-4 py-3 text-left"
            >
                <CheckCircle2 className="size-5 text-success shrink-0" />
                <span className="flex-1 min-w-0 text-[14px] font-medium text-foreground truncate">
                    {record.exercise.name}
                </span>
                <span className="text-[13px] text-muted-foreground tabular-nums whitespace-nowrap">
                    {record.logs.length} × {record.targetReps}
                    {loggedWeight != null && ` · ${formatWeightPtBr(loggedWeight)} ${UNITS.WEIGHT}`}
                </span>
                <ChevronDown className={cn(
                    "size-4 text-muted-foreground shrink-0 transition-transform duration-200",
                    isOpen && "rotate-180"
                )} />
            </button>

            {isOpen && (
                <div className="flex flex-col gap-4 px-4 pb-4">
                    <SetTiles
                        total={record.effectiveTargetSets}
                        done={record.logs.length}
                        repLabel={repLabelFor(record)}
                        onUndo={() => undoLastSet(record.exerciseId)}
                        compact
                    />

                    {usesLoad && (
                        <ExerciseWeightField
                            id={`weight-done-${record.exerciseId}`}
                            value={weight.value}
                            onChange={weight.handleChange}
                            onStep={weight.handleStep}
                            onRepeat={weight.handleRepeat}
                            lastWeight={lastWeight}
                        />
                    )}

                    {onAddExtraSet && (
                        <button
                            type="button"
                            className="relative tap-target flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors self-start"
                            onClick={onAddExtraSet}
                        >
                            <Plus className="size-4" />
                            Série extra
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default SimpleCompletedExerciseCard;
