import type { EnrichedExerciseRecord, WorkoutSession } from "@/features/workouts/workout.types.ts";
import ExerciseRecord from "@/features/workouts/components/active-workout/exercise-stack/ExerciseRecord.tsx";
import { useAutoTransition } from "@/features/workouts/hooks/useAutoTransition.ts";

type DynamicExerciseStackProps = {
    exerciseStack: EnrichedExerciseRecord[];
    session: WorkoutSession;
    lastSession?: WorkoutSession | null;
};

const DynamicExerciseStack = ({ exerciseStack, session, lastSession }: DynamicExerciseStackProps) => {
    useAutoTransition(exerciseStack);

    if (!exerciseStack.length) {
        return (
            <div className="text-muted-foreground text-center p-4 border rounded-xl border-dashed">
                Nenhum exercício planejado para este treino.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {exerciseStack.map((record) => (
                <div key={`${record.exerciseId}-${record.status}`} id={`exercise-${record.exerciseId}`}>
                    <ExerciseRecord
                        record={record}
                        sessionId={session.id}
                        lastSession={lastSession}
                    />
                </div>
            ))}
        </div>
    );
};

export default DynamicExerciseStack;
