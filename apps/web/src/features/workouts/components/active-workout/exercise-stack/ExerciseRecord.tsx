import { useState } from "react";
import { motion } from "framer-motion";
import type { EnrichedExerciseRecord, WorkoutSession } from "@/features/workouts/workout.types.ts";
import ExerciseHeaderMinimized from "./records/ExerciseHeaderMinimized";
import ActiveExerciseCard from "@/features/workouts/components/active-workout/exercise-stack/records/ActiveExerciseCard.tsx";
import ExercisePreviewItem from "@/features/workouts/components/active-workout/exercise-stack/records/ExercisePreviewItem.tsx";

type ExerciseRecordProps = {
    record: EnrichedExerciseRecord;
    sessionId: number;
    lastSession?: WorkoutSession | null;
};

const ExerciseRecord = ({ record, sessionId, lastSession }: ExerciseRecordProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    switch (record.status) {
        case "COMPLETED":
            if (isExpanded) {
                return (
                    <ActiveExerciseCard
                        record={record}
                        sessionId={sessionId}
                        isReadOnly={true}
                        onHeaderClick={() => setIsExpanded(false)}
                        lastSession={lastSession}
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
                    <ActiveExerciseCard record={record} sessionId={sessionId} lastSession={lastSession} />
                </motion.div>
            );

        case "PENDING":
            return <ExercisePreviewItem record={record} />;

        default:
            console.warn(`Status de exercício não mapeado: ${record.status}`);
            return null;
    }
};

export default ExerciseRecord;
