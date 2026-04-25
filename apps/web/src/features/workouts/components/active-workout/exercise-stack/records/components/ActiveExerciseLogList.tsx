import { CompletedSetRow } from "../CompletedSetRow.tsx";
import { ActiveSetInputRow, type SetSubmissionData } from "../ActiveSetInputRow.tsx";
import { PendingSetRow } from "../PendingSetRow.tsx";
import type { EnrichedExerciseRecord } from "@/features/workouts/workout.types.ts";

interface ActiveExerciseLogListProps {
    record: EnrichedExerciseRecord;
    isReadOnly: boolean;
    showEquipmentWeight: boolean;
    activeSetNumber: number;
    pendingSetsCount: number;
    suggestions: {
        weight?: number;
        equipWeight?: number;
    };
    handleSetConfirm: (setNumber: number, data: SetSubmissionData) => void;
    isPending: boolean;
}

export const ActiveExerciseLogList = ({
    record,
    isReadOnly,
    showEquipmentWeight,
    activeSetNumber,
    pendingSetsCount,
    suggestions,
    handleSetConfirm,
    isPending
}: ActiveExerciseLogListProps) => {
    return (
        <div className="flex flex-col">
            {record.logs.map((log) => (
                <CompletedSetRow 
                    key={log.id} 
                    log={log} 
                    showEquipmentWeight={showEquipmentWeight} 
                />
            ))}
            {!isReadOnly && (
                <>
                    <ActiveSetInputRow
                        setNumber={activeSetNumber}
                        targetReps={record.targetReps}
                        previousWeight={suggestions.weight}
                        showEquipmentWeight={showEquipmentWeight}
                        previousEquipmentWeight={suggestions.equipWeight}
                        onConfirm={(data) => handleSetConfirm(activeSetNumber, data)}
                        isPending={isPending}
                    />

                    {Array.from({ length: pendingSetsCount }).map((_, idx) => {
                        const futureSetNum = activeSetNumber + 1 + idx;
                        return (
                            <PendingSetRow
                                key={`pending-${futureSetNum}`}
                                setNum={futureSetNum}
                                reps={record.targetReps}
                                showEquipmentWeight={showEquipmentWeight}
                            />
                        );
                    })}
                </>
            )}
        </div>
    );
};
