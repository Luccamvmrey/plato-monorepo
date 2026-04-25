import type { EnrichedExerciseRecord, WorkoutSession } from "@/features/workouts/workout.types.ts";
import { cn } from "@/lib/utils.ts";
import { useActiveExerciseCardLogic } from "@/features/workouts/hooks/useActiveExerciseCardLogic.ts";
import { ActiveExerciseCardHeader } from "./components/ActiveExerciseCardHeader.tsx";
import { ActiveExerciseGridHeader } from "./components/ActiveExerciseGridHeader.tsx";
import { ActiveExerciseLogList } from "./components/ActiveExerciseLogList.tsx";

type ActiveExerciseCardProps = {
    record: EnrichedExerciseRecord;
    sessionId: number;
    isReadOnly?: boolean;
    onHeaderClick?: () => void;
    lastSession?: WorkoutSession | null;
};

const ActiveExerciseCard = ({ record, sessionId, isReadOnly = false, onHeaderClick, lastSession }: ActiveExerciseCardProps) => {
    const {
        showEquipmentWeight,
        toggleEquipmentWeight,
        suggestions,
        activeSetNumber,
        pendingSetsCount,
        handleSetConfirm,
        isPending,
    } = useActiveExerciseCardLogic(record, sessionId, lastSession, isReadOnly);

    return (
        <div className={cn(
            "flex flex-col border-2 rounded-xl overflow-hidden bg-card shadow-sm transition-all",
            isReadOnly ? "border-muted opacity-90 scale-[0.98]" : "border-primary"
        )}>
            <ActiveExerciseCardHeader
                name={record.exercise.name}
                targetMuscle={record.exercise.targetMuscle}
                isReadOnly={isReadOnly}
                showEquipmentWeight={showEquipmentWeight}
                onToggleEquipmentWeight={toggleEquipmentWeight}
                onHeaderClick={onHeaderClick}
            />

            <ActiveExerciseGridHeader 
                showEquipmentWeight={showEquipmentWeight} 
            />

            <ActiveExerciseLogList
                record={record}
                isReadOnly={isReadOnly}
                showEquipmentWeight={showEquipmentWeight}
                activeSetNumber={activeSetNumber}
                pendingSetsCount={pendingSetsCount}
                suggestions={suggestions}
                handleSetConfirm={handleSetConfirm}
                isPending={isPending}
            />
        </div>
    );
};

export default ActiveExerciseCard;
