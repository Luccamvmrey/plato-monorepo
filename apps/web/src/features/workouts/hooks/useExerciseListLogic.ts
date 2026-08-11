import { useMemo } from "react";
import { buildGroupMembership } from "@plato/shared";
import { useWorkoutEditorStore } from "@/features/workouts/stores/workout-editor.store.ts";

export const useExerciseListLogic = () => {
    const exercises = useWorkoutEditorStore(state => state.exercises);

    // Estado derivado da lista, computado no cliente: o grupo é definido por
    // contiguidade, então ele já está inteiramente contido na ordem + `groupKey`.
    const membership = useMemo(() => buildGroupMembership(exercises), [exercises]);

    return { exercises, membership };
};
