import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { CompletedSetRow } from "./CompletedSetRow";
import type { EnrichedExerciseRecord } from "@/features/workouts/workout.types.ts";
import { UNITS } from "@/core/constants/units.ts";

type CompletedExerciseCardProps = {
    record: EnrichedExerciseRecord;
    onHeaderClick?: () => void;
};

const CompletedExerciseCard = ({ record, onHeaderClick }: CompletedExerciseCardProps) => (
    <div
        className={cn(
            "flex flex-col gap-2 p-4 rounded-xl bg-card border border-border",
            onHeaderClick && "cursor-pointer hover:bg-muted/20 transition-colors"
        )}
        onClick={onHeaderClick}
    >
        <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-success flex-shrink-0" />
            <span className="text-[13px] font-medium text-muted-foreground flex-1">
                {record.exercise.name}
            </span>
            <span className="text-[11px] text-muted-foreground">
                {record.logs.length} / {record.targetSets}{" "}
                {record.targetSets === 1 ? UNITS.SINGLE_SET : UNITS.SETS}
            </span>
        </div>
        <div className="flex flex-col gap-1.5">
            {record.logs.map(log => (
                <CompletedSetRow key={log.id} log={log} variant="summary" />
            ))}
        </div>
    </div>
);

export default CompletedExerciseCard;
