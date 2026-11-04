import type { EnrichedExerciseRecord } from "@/features/workouts/workout.types.ts";
import { CheckCircle2, ChevronDown } from "lucide-react";

type ExerciseHeaderMinimizedProps = {
    record: EnrichedExerciseRecord;
    onClick?: () => void;
};

/** Exercício concluído: uma linha, a mesma nos dois modos de registro. */
const ExerciseHeaderMinimized = ({ record, onClick }: ExerciseHeaderMinimizedProps) => (
    <button
        type="button"
        aria-expanded={false}
        onClick={onClick}
        className="w-full min-h-14 flex items-center gap-3 px-4 py-3 text-left rounded-xl bg-card border border-border transition-transform active:scale-[0.99]"
    >
        <CheckCircle2 className="size-5 text-success shrink-0" />
        <span className="flex-1 min-w-0 text-[14px] font-medium truncate">{record.exercise.name}</span>
        <span className="text-[13px] text-muted-foreground tabular-nums whitespace-nowrap">
            {record.logs.length}/{record.effectiveTargetSets}
        </span>
        <ChevronDown className="size-4 text-muted-foreground shrink-0" />
    </button>
);

export default ExerciseHeaderMinimized;
