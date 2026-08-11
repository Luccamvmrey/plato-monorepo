import type { SessionSetPayload, Workout, WorkoutSession } from "@/features/workouts/workout.types.ts";
import { buildExerciseStack } from "@/features/workouts/utils/exercise-stack.ts";
import { useMemo } from "react";

/**
 * Envelope de memoização em volta de `buildExerciseStack`. A lógica mora na função
 * pura para poder ser exercitada sem navegador — é a parte mais delicada da tela.
 */
export const useExerciseStack = (
    workout?: Workout,
    session?: WorkoutSession,
    pendingSets?: SessionSetPayload[],
    sessionExerciseOrder?: number[] | null,
    exerciseExtraSets?: Record<number, number>,
) => {
    const exerciseStack = useMemo(
        () => buildExerciseStack({ workout, session, pendingSets, sessionExerciseOrder, exerciseExtraSets }),
        [workout, session, pendingSets, sessionExerciseOrder, exerciseExtraSets],
    );

    return { exerciseStack };
}
