import type { EnrichedExerciseRecord } from "@/features/workouts/workout.types.ts";

type SessionProgressProps = {
    exerciseStack: EnrichedExerciseRecord[];
};

export const SessionProgress = ({ exerciseStack }: SessionProgressProps) => {
    const totalSets = exerciseStack.reduce((acc, ex) => acc + ex.targetSets, 0);
    const completedSets = exerciseStack.reduce((acc, ex) => acc + ex.logs.length, 0);
    const progress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

    const activeExercise = exerciseStack.find(ex => ex.status === "ACTIVE");

    return (
        <div className="flex flex-col gap-1.5">
            {activeExercise && (
                <span className="text-[11px] text-muted-foreground">
                    {activeExercise.exercise.name} · set {activeExercise.logs.length + 1} / {activeExercise.targetSets}
                </span>
            )}
            <div className="h-[3px] bg-muted rounded-full w-full overflow-hidden">
                <div
                    className="h-[3px] bg-success rounded-full transition-all duration-[400ms] ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
};
