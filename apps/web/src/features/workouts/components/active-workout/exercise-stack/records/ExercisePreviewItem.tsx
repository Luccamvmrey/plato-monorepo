import type { EnrichedExerciseRecord } from "@/features/workouts/workout.types.ts";
import { MuscleBadge } from "@/core/components/MuscleBadge";
import SessionGroupBadge from "@/features/workouts/components/active-workout/components/SessionGroupBadge.tsx";

type ExercisePreviewItemProps = {
    record: EnrichedExerciseRecord;
};

const ExercisePreviewItem = ({ record }: ExercisePreviewItemProps) => {
    return (
        <div className="flex flex-col gap-1.5 px-4 py-3 rounded-xl bg-card border border-border opacity-50">
            <div className="flex items-center gap-3">
                <span className="text-[13px] font-medium text-foreground flex-1">
                    {record.exercise.name}
                </span>
                <MuscleBadge muscle={record.exercise.targetMuscle} />
                {/* Num bi-set o exercício volta para a fila com séries já feitas. Sem
                    mostrar o progresso, "3 × 10" faz parecer que o trabalho sumiu. */}
                <span className="text-[12px] text-muted-foreground whitespace-nowrap">
                    {record.logs.length > 0
                        ? `${record.logs.length}/${record.effectiveTargetSets} séries`
                        : `${record.targetSets} × ${record.targetReps}`}
                </span>
            </div>
            <SessionGroupBadge group={record.group} className="self-start" />
        </div>
    );
};

export default ExercisePreviewItem;
