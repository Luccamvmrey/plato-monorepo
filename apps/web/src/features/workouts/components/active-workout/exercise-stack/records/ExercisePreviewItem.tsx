import { cn } from "@/lib/utils.ts";
import SessionGroupBadge from "@/features/workouts/components/active-workout/components/SessionGroupBadge.tsx";
import type { EnrichedExerciseRecord } from "@/features/workouts/workout.types.ts";

type ExercisePreviewItemProps = {
    record: EnrichedExerciseRecord;
};

/** Próximo da fila, nos dois modos: as séries como blocos em miniatura. */
const ExercisePreviewItem = ({ record }: ExercisePreviewItemProps) => (
    <div className="flex flex-col gap-1.5 px-4 py-3 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-3">
            <span className="flex-1 min-w-0 text-[14px] font-medium text-muted-foreground truncate">
                {record.exercise.name}
            </span>
            <div className="flex items-center gap-1" aria-hidden>
                {Array.from({ length: record.effectiveTargetSets }).map((_, index) => (
                    <span
                        key={index}
                        className={cn(
                            "w-3 h-3 rounded-[3px]",
                            index < record.logs.length ? "bg-success" : "bg-muted"
                        )}
                    />
                ))}
            </div>
            {/* Num bi-set o exercício volta para a fila com séries já feitas. Sem
                mostrar o progresso, "3 × 10" faz parecer que o trabalho sumiu. */}
            <span className="text-[13px] text-muted-foreground tabular-nums whitespace-nowrap">
                {record.logs.length > 0
                    ? `${record.logs.length}/${record.effectiveTargetSets}`
                    : `${record.effectiveTargetSets} × ${record.targetReps}`}
            </span>
        </div>
        <SessionGroupBadge group={record.group} className="self-start" />
    </div>
);

export default ExercisePreviewItem;
