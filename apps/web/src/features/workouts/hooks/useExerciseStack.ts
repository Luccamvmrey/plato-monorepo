import type { EnrichedExerciseRecord, SessionSet, SessionSetPayload, Workout, WorkoutSession } from "@/features/workouts/workout.types.ts";
import { useMemo } from "react";

export const useExerciseStack = (
    workout?: Workout,
    session?: WorkoutSession,
    pendingSets?: SessionSetPayload[],
    sessionExerciseOrder?: number[] | null,
    exerciseExtraSets?: Record<number, number>,
) => {
    const exerciseStack = useMemo(() => {
        if (!workout || !session) return [];

        let foundActive = false;
        const plannedExercises = workout.workoutExercise || [];
        const serverLogs = session.sessionSet || [];
        const extraSets = exerciseExtraSets ?? {};

        // Merge server-confirmed sets with locally pending sets for UI computation.
        // Pending sets use negative fake IDs so they never collide with DB rows.
        const fakePending: SessionSet[] = (pendingSets ?? []).map((p, i) => ({
            ...p,
            id: -(i + 1),
            userObservation: p.userObservation ?? null,
            createdAt: new Date(),
        } as unknown as SessionSet));
        const allLogs = [...serverLogs, ...fakePending];

        const sortedPlanned = sessionExerciseOrder
            ? [...plannedExercises].sort(
                (a, b) =>
                    sessionExerciseOrder.indexOf(a.exerciseId) -
                    sessionExerciseOrder.indexOf(b.exerciseId)
              )
            : [...plannedExercises].sort((a, b) => a.orderIndex - b.orderIndex);

        return sortedPlanned.map((planned): EnrichedExerciseRecord => {
            const effectiveTarget = planned.targetSets + (extraSets[planned.exerciseId] ?? 0);
            const exerciseLogs = allLogs.filter(
                (log) => log.exerciseId === planned.exerciseId
            );

            const isCompleted = exerciseLogs.length >= effectiveTarget;
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
                effectiveTargetSets: effectiveTarget,
            };
        })
    }, [workout, session, pendingSets, sessionExerciseOrder, exerciseExtraSets]);

    return { exerciseStack };
}
