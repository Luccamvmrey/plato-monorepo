import type { Exercise, Workout, WorkoutExercise } from "@/features/workouts/workout.types.ts";
import { create } from "zustand";
import { arrayMove } from "@dnd-kit/sortable";

const generateSafeId = () => {
    if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
        return window.crypto.randomUUID();
    }
    // Fallback robusto para mobile/HTTP
    return `id-${Math.random().toString(36).slice(2, 11)}-${Date.now().toString(36)}`;
};

export interface WorkoutExerciseDraft {
    instanceId: string;
    exercise: Exercise;
    targetSets: number;
    targetReps: number;
    orderIndex: number;
    observations?: string;
}

interface WorkoutEditorState {
    name: string;
    description: string;
    exercises: WorkoutExerciseDraft[];
    isSubmitting: boolean;
}

interface WorkoutEditorActions {
    // Meta
    setWorkoutInfo: (field: "name" | "description", value: string) => void;

    // Exercise List
    addExercises: (exercises: Exercise[]) => void;
    removeExercise: (instanceId: string) => void;
    updateExerciseField: (instanceId: string, field: "targetSets" | "targetReps", value: number) => void;

    loadWorkout: (workout: Workout) => void;

    // Sorting
    reorderExercises: (activeId: string | number, overId: string | number) => void;

    // Lifecycle
    reset: () => void;
}

export const useWorkoutEditorStore = create<WorkoutEditorState & WorkoutEditorActions>((set) => ({
    name: "",
    description: "",
    exercises: [],
    isSubmitting: false,

    setWorkoutInfo: (field, value) => set((state) => ({ ...state, [field]: value })),

    addExercises: (newExercises) => set((state) => {
        const drafts: WorkoutExerciseDraft[] = newExercises.map((ex, index) => ({
            instanceId: generateSafeId(),
            exercise: ex,
            targetSets: 0,
            targetReps: 0,
            orderIndex: state.exercises.length + index + 1
        }));
        return { exercises: [...state.exercises, ...drafts] };
    }),

    removeExercise: (instanceId) => set((state) => {
        const filtered = state.exercises.filter(ex => ex.instanceId !== instanceId);
        const resynced = filtered.map((ex, idx) => ({ ...ex, orderIndex: idx + 1 }));
        return { exercises: resynced };
    }),

    updateExerciseField: (instanceId, field, value) => set((state) => ({
        exercises: state.exercises.map((ex) =>
            ex.instanceId === instanceId ? { ...ex, [field]: value } : ex
        )
    })),

    loadWorkout: (workout) => set({
        name: workout.name,
        description: workout.description,
        exercises: workout.workoutExercise.map((we: WorkoutExercise) => ({
            instanceId: generateSafeId(),
            exercise: we.exercise,
            targetSets: we.targetSets,
            targetReps: we.targetReps,
            orderIndex: we.orderIndex
        })),
        isSubmitting: false,
    }),

    reorderExercises: (activeId, overId) => set((state) => {
        const oldIndex = state.exercises.findIndex(ex => ex.instanceId === activeId);
        const newIndex = state.exercises.findIndex(ex => ex.instanceId === overId);

        if (oldIndex === -1 || newIndex === -1) return state;

        const newOrder = arrayMove(state.exercises, oldIndex, newIndex);

        return {
            exercises: newOrder.map((ex, idx) => ({ ...ex, orderIndex: idx + 1 }))
        };
    }),

    reset: () => set({ name: "", description: "", exercises: [], isSubmitting: false }),
}))
