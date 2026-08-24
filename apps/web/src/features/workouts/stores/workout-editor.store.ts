import type { Exercise, Workout, WorkoutExercise } from "@/features/workouts/workout.types.ts";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { arrayMove } from "@dnd-kit/sortable";
import {
    DEFAULT_GROUP_TYPE,
    normalizeExerciseGroups,
    type ExerciseGroupTypeValue,
} from "@plato/shared";

// Novos exercícios já entram num estado válido — 0/0 era exatamente o que a
// validação de submit rejeita, forçando o usuário a preencher 2 campos por exercício.
const DEFAULT_TARGET_SETS = 3;
const DEFAULT_TARGET_REPS = 10;

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
    /** Rótulo do grupo (bi-set/tri-set). Null = solto. Ver `@plato/shared`. */
    groupKey?: string | null;
    groupType?: ExerciseGroupTypeValue | null;
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
    replaceExercise: (instanceId: string, exercise: Exercise) => void;
    updateExerciseField: (instanceId: string, field: "targetSets" | "targetReps", value: number) => void;

    loadWorkout: (workout: Workout) => void;

    // Sorting
    reorderExercises: (activeId: string | number, overId: string | number) => void;

    // Grouping
    groupWithNext: (instanceId: string) => void;
    ungroup: (instanceId: string) => void;

    // Lifecycle
    reset: () => void;
}

/**
 * Re-sincroniza `orderIndex` 1..n e dissolve grupo que deixou de ser contíguo.
 *
 * Toda operação que muda a ORDEM ou a COMPOSIÇÃO da lista passa por aqui. Sem a
 * normalização, arrastar um membro de um bi-set para longe deixaria os dois com a
 * chave antiga e o treino afirmaria um agrupamento que não existe mais.
 */
const resync = (exercises: WorkoutExerciseDraft[]): WorkoutExerciseDraft[] =>
    normalizeExerciseGroups(exercises).map((ex, idx) => (
        ex.orderIndex === idx + 1 ? ex : { ...ex, orderIndex: idx + 1 }
    ));

export const useWorkoutEditorStore = create<WorkoutEditorState & WorkoutEditorActions>()(
    persist(
        (set) => ({
            name: "",
            description: "",
            exercises: [],
            isSubmitting: false,

            setWorkoutInfo: (field, value) => set((state) => ({ ...state, [field]: value })),

            addExercises: (newExercises) => set((state) => {
                const drafts: WorkoutExerciseDraft[] = newExercises.map((ex, index) => ({
                    instanceId: generateSafeId(),
                    exercise: ex,
                    targetSets: DEFAULT_TARGET_SETS,
                    targetReps: DEFAULT_TARGET_REPS,
                    orderIndex: state.exercises.length + index + 1,
                    groupKey: null,
                    groupType: null,
                }));
                return { exercises: [...state.exercises, ...drafts] };
            }),

            removeExercise: (instanceId) => set((state) => ({
                exercises: resync(state.exercises.filter(ex => ex.instanceId !== instanceId)),
            })),

            // Troca o exercício preservando séries, repetições e posição: quem
            // substitui quer o mesmo lugar na prescrição, com outro movimento. O
            // grupo também fica — trocar um movimento não desfaz o bi-set.
            replaceExercise: (instanceId, exercise) => set((state) => ({
                exercises: state.exercises.map((ex) =>
                    ex.instanceId === instanceId ? { ...ex, exercise } : ex
                )
            })),

            updateExerciseField: (instanceId, field, value) => set((state) => ({
                exercises: state.exercises.map((ex) =>
                    ex.instanceId === instanceId ? { ...ex, [field]: value } : ex
                )
            })),

            loadWorkout: (workout) => set({
                name: workout.name,
                description: workout.description ?? "",
                exercises: workout.workoutExercise
                    .filter(we => we.exercise)
                    // O GET não ordena `workoutExercise` (WORKOUT_INCLUDE não tem
                    // orderBy), então a ordem vem física do Postgres. Ordenar aqui não
                    // é zelo: grupo é definido por contiguidade, e uma lista fora de
                    // ordem dissolveria bi-sets legítimos na normalização.
                    .slice()
                    .sort((a, b) => a.orderIndex - b.orderIndex || a.id - b.id)
                    .map((we: WorkoutExercise) => ({
                        instanceId: generateSafeId(),
                        exercise: we.exercise!,
                        targetSets: we.targetSets,
                        targetReps: we.targetReps,
                        orderIndex: we.orderIndex,
                        groupKey: we.groupKey,
                        groupType: we.groupType,
                    })),
                isSubmitting: false,
            }),

            reorderExercises: (activeId, overId) => set((state) => {
                const oldIndex = state.exercises.findIndex(ex => ex.instanceId === activeId);
                const newIndex = state.exercises.findIndex(ex => ex.instanceId === overId);

                if (oldIndex === -1 || newIndex === -1) return state;

                return { exercises: resync(arrayMove(state.exercises, oldIndex, newIndex)) };
            }),

            /**
             * Emenda este exercício ao de baixo.
             *
             * Quando os dois já pertencem a grupos diferentes, os grupos são fundidos:
             * todos os membros do grupo de baixo passam a usar a chave do de cima. Só
             * reetiquetar os dois vizinhos deixaria o resto do grupo de baixo com uma
             * chave que perdeu um membro — e a normalização o dissolveria em silêncio.
             */
            groupWithNext: (instanceId) => set((state) => {
                const index = state.exercises.findIndex(ex => ex.instanceId === instanceId);
                if (index === -1 || index === state.exercises.length - 1) return state;

                const current = state.exercises[index];
                const next = state.exercises[index + 1];

                const key = current.groupKey ?? next.groupKey ?? generateSafeId();
                const groupType = current.groupType ?? next.groupType ?? DEFAULT_GROUP_TYPE;
                const absorbed = next.groupKey;

                return {
                    exercises: resync(state.exercises.map((ex) => {
                        const isPair = ex.instanceId === current.instanceId
                            || ex.instanceId === next.instanceId;
                        const isAbsorbed = absorbed != null && ex.groupKey === absorbed;

                        return isPair || isAbsorbed ? { ...ex, groupKey: key, groupType } : ex;
                    })),
                };
            }),

            /** Desfaz o grupo inteiro a que este exercício pertence. */
            ungroup: (instanceId) => set((state) => {
                const target = state.exercises.find(ex => ex.instanceId === instanceId);
                if (!target?.groupKey) return state;

                return {
                    exercises: resync(state.exercises.map((ex) =>
                        ex.groupKey === target.groupKey
                            ? { ...ex, groupKey: null, groupType: null }
                            : ex
                    )),
                };
            }),

            reset: () => set({ name: "", description: "", exercises: [], isSubmitting: false }),
        }),
        {
            name: "plato-workout-editor-storage",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                name: state.name,
                description: state.description,
                exercises: state.exercises,
            }),
        }
    )
)
