import { useState } from "react";
import { motion } from "framer-motion";
import { GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import type { EnrichedExerciseRecord, ExerciseHistoryMap } from "@/features/workouts/workout.types.ts";
import ExerciseHeaderMinimized from "./records/ExerciseHeaderMinimized";
import ExerciseHeaderInactive from "./records/ExerciseHeaderInactive";
import ActiveExerciseCard from "@/features/workouts/components/active-workout/exercise-stack/records/ActiveExerciseCard.tsx";
import CompletedExerciseCard from "@/features/workouts/components/active-workout/exercise-stack/records/CompletedExerciseCard.tsx";
import ExercisePreviewItem from "@/features/workouts/components/active-workout/exercise-stack/records/ExercisePreviewItem.tsx";

type ExerciseRecordProps = {
    record: EnrichedExerciseRecord;
    sessionId: number;
    history?: ExerciseHistoryMap;
    addExtraSet?: (exerciseId: number) => void;
    onSwapRequest?: () => void;
    onUndoSkip?: () => void;
    isChangingPlan?: boolean;
};

const SortablePendingItem = ({
    record,
    onSwapRequest,
}: {
    record: EnrichedExerciseRecord;
    onSwapRequest?: () => void;
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: record.exerciseId,
    });

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={cn("flex items-center gap-2", isDragging && "opacity-50")}
        >
            <button
                className="touch-none flex-shrink-0 text-muted-foreground/40 cursor-grab active:cursor-grabbing p-1"
                onClick={(e) => e.stopPropagation()}
                {...listeners}
                {...attributes}
            >
                <GripVertical className="size-4" />
            </button>
            <div className="flex-1" onClick={onSwapRequest}>
                <ExercisePreviewItem record={record} />
            </div>
        </div>
    );
};

const ExerciseRecord = ({
    record,
    sessionId,
    history,
    addExtraSet,
    onSwapRequest,
    onUndoSkip,
    isChangingPlan,
}: ExerciseRecordProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    switch (record.status) {
        case "COMPLETED":
            if (isExpanded) {
                return (
                    <CompletedExerciseCard
                        record={record}
                        onHeaderClick={() => setIsExpanded(false)}
                        onAddExtraSet={addExtraSet ? () => addExtraSet(record.exerciseId) : undefined}
                    />
                );
            }
            return (
                <ExerciseHeaderMinimized
                    record={record}
                    onClick={() => setIsExpanded(true)}
                />
            );

        case "ACTIVE":
            return (
                <motion.div
                    key={record.exerciseId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                    <ActiveExerciseCard record={record} sessionId={sessionId} history={history} />
                </motion.div>
            );

        case "PENDING":
            return <SortablePendingItem record={record} onSwapRequest={onSwapRequest} />;

        case "SKIPPED":
        case "REPLACED":
            return (
                <ExerciseHeaderInactive
                    record={record}
                    onUndoSkip={onUndoSkip}
                    isPending={isChangingPlan}
                />
            );

        default:
            console.warn(`Status de exercício não mapeado: ${record.status}`);
            return null;
    }
};

export default ExerciseRecord;
