import { CheckCircle2, ChevronUp, Plus } from "lucide-react";
import { CompletedSetRow } from "./CompletedSetRow";
import type { EnrichedExerciseRecord } from "@/features/workouts/workout.types.ts";

type CompletedExerciseCardProps = {
    record: EnrichedExerciseRecord;
    onHeaderClick?: () => void;
    onAddExtraSet?: () => void;
};

const CompletedExerciseCard = ({ record, onHeaderClick, onAddExtraSet }: CompletedExerciseCardProps) => (
    <div className="rounded-xl bg-card border border-border">
        <button
            type="button"
            aria-expanded
            onClick={onHeaderClick}
            className="w-full min-h-14 flex items-center gap-3 px-4 py-3 text-left"
        >
            <CheckCircle2 className="size-5 text-success shrink-0" />
            <span className="flex-1 min-w-0 text-[14px] font-medium truncate">{record.exercise.name}</span>
            <span className="text-[13px] text-muted-foreground tabular-nums whitespace-nowrap">
                {record.logs.length}/{record.effectiveTargetSets}
            </span>
            <ChevronUp className="size-4 text-muted-foreground shrink-0" />
        </button>

        <div className="divide-y divide-border border-t border-border">
            {record.logs.map((log) => (
                <CompletedSetRow key={log.id} log={log} />
            ))}
        </div>

        {onAddExtraSet && (
            <button
                type="button"
                className="w-full h-11 flex items-center gap-1.5 px-4 border-t border-border text-[13px] text-muted-foreground hover:text-foreground transition-colors"
                onClick={onAddExtraSet}
            >
                <Plus className="size-4" />
                Série extra
            </button>
        )}
    </div>
);

export default CompletedExerciseCard;
