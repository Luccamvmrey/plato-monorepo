import type { EnrichedExerciseRecord, Workout, WorkoutSession } from "@/features/workouts/workout.types.ts";
import { useMemo } from "react";

export const useExerciseStack = (
    workout?: Workout,
    session?: WorkoutSession,
) => {
    const exerciseStack = useMemo(() => {
        if (!workout || !session) return [];

        let foundActive = false;
        const plannedExercises = workout.workoutExercise || [];
        const executedLogs = session.sessionSet || [];

        const sortedPlanned = [...plannedExercises].sort((a, b) => a.orderIndex - b.orderIndex);

        return sortedPlanned.map((planned): EnrichedExerciseRecord => {
            const exerciseLogs = executedLogs.filter(
                (log) => log.exerciseId === planned.exerciseId
            );

            const isCompleted = exerciseLogs.length >= planned.targetSets;
            let currentStatus: EnrichedExerciseRecord["status"];

            if (isCompleted) {
                currentStatus = "COMPLETED";
            } else if (!foundActive) {
                currentStatus = "ACTIVE";
                foundActive = true;
            } else {
                currentStatus = "PENDING";
            }

            return {
                ...planned,
                exercise: planned.exercise!,
                logs: exerciseLogs,
                status: currentStatus,
            };
        })
    }, [workout, session]);

    return { exerciseStack };
}