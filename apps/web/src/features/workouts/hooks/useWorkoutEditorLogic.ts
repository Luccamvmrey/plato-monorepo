import { useLocation, useParams } from "wouter";
import { useWorkouts } from "./useWorkouts";
import { useWorkoutEditorStore } from "@/features/workouts/stores/workout-editor.store";
import { useSensor, useSensors, type DragEndEvent, closestCenter, TouchSensor, MouseSensor } from "@dnd-kit/core";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { path } from "@/core/constants/path";
import { useSuccessState } from "@/core/hooks/useSuccessState";
import { focusField } from "@/core/utils/focus";
import { findRedundantGroups } from "@/features/workouts/utils/movement";
import type { WorkoutExerciseDraft } from "@/features/workouts/stores/workout-editor.store";

export const useWorkoutEditorLogic = () => {
    const { id } = useParams();
    const navigate = useLocation()[1];

    const { workoutByIdQuery, updateWorkoutMutation, createWorkoutMutation } = useWorkouts(id);
    const { data: workout, isLoading: isFetching } = workoutByIdQuery;
    const isSaving = updateWorkoutMutation.isPending || createWorkoutMutation.isPending;

    const name = useWorkoutEditorStore(state => state.name);
    const description = useWorkoutEditorStore(state => state.description);
    const exercises = useWorkoutEditorStore(state => state.exercises);
    const reorderExercises = useWorkoutEditorStore(state => state.reorderExercises);
    const loadWorkout = useWorkoutEditorStore(state => state.loadWorkout);
    const reset = useWorkoutEditorStore(state => state.reset);

    const [validationErrors, setValidationErrors] = useState<{ name?: string; exercises?: string }>({});
    const [inspectedDraft, setInspectedDraft] = useState<WorkoutExerciseDraft | null>(null);
    const { isSuccess, trigger: triggerSuccess } = useSuccessState();

    const saveError = (updateWorkoutMutation.isError || createWorkoutMutation.isError)
        ? "Erro ao salvar treino. Verifique sua conexão e tente novamente."
        : null;

    useEffect(() => {
        if (isFetching) return;

        if (workout === null) {
            console.warn("Invalid workout access, redirecting...");
            navigate(path.WORKOUTS);
        }
    }, [workout, id, isFetching, navigate]);

    useEffect(() => {
        if (workout) {
            loadWorkout(workout);
        }
    }, [workout, loadWorkout]);

    const sensors = useSensors(
        useSensor(MouseSensor),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        })
    );

    const clearNameError = () => {
        setValidationErrors(prev => {
            if (!prev.name) return prev;
            const next = { ...prev };
            delete next.name;
            return next;
        });
    };

    const handleNameBlur = (value: string) => {
        if (!value.trim()) {
            setValidationErrors(prev => ({ ...prev, name: "O nome do treino é obrigatório." }));
        } else {
            clearNameError();
        }
    };

    // O erro só sumia no blur seguinte, então o campo continuava vermelho enquanto
    // o usuário corrigia. No change a gente só limpa — nunca acusa —, senão o erro
    // aparece já na primeira letra apagada.
    const handleNameChange = (value: string) => {
        if (value.trim()) clearNameError();
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        setValidationErrors({});

        // Every branch below sends the user to the thing that failed. Without this
        // the error renders at the bottom of a long form — off-screen, and further
        // off-screen still once the keyboard is up — so submitting looks like a no-op.
        if (!name.trim()) {
            setValidationErrors({ name: "O nome do treino é obrigatório." });
            focusField('[data-editor-field="name"]');
            return;
        }
        if (exercises.length === 0) {
            setValidationErrors({ exercises: "Adicione pelo menos um exercício." });
            focusField("[data-exercises-error]");
            return;
        }

        const firstIncomplete = exercises.find((ex) => ex.targetSets === 0 || ex.targetReps === 0);
        if (firstIncomplete) {
            setValidationErrors({ exercises: "Defina as séries e repetições para todos os exercícios." });
            const field = firstIncomplete.targetSets === 0 ? "sets" : "reps";
            focusField(`[data-instance-id="${firstIncomplete.instanceId}"] [data-editor-field="${field}"]`);
            return;
        }

        const payload = {
            name,
            description,
            exercises: exercises.map((ex, index) => ({
                exerciseId: ex.exercise.id,
                targetSets: ex.targetSets,
                targetReps: ex.targetReps,
                orderIndex: index + 1
            }))
        };

        try {
            if (id && id !== "new") {
                await updateWorkoutMutation.mutateAsync({ id, payload });
            } else {
                await createWorkoutMutation.mutateAsync(payload);
            }
            reset();
            triggerSuccess();
            await new Promise(r => setTimeout(r, 1500));
            navigate(path.WORKOUTS);
        } catch {
            // saveError is derived from mutation.isError above
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            reorderExercises(active.id as string, over.id as string);
        }
    };

    const handleDragStart = () => {
        if (window.navigator?.vibrate) window.navigator.vibrate(75);
    };

    // Estado derivado dos exercícios do rascunho — nada a persistir, nada a buscar.
    const redundantGroups = useMemo(() => findRedundantGroups(exercises), [exercises]);

    return {
        id,
        isFetching,
        isSaving,
        isSuccess,
        validationErrors,
        saveError,
        sensors,
        handleSubmit,
        handleNameBlur,
        handleNameChange,
        handleDragEnd,
        handleDragStart,
        collisionDetection: closestCenter,
        redundantGroups,
        inspectedDraft,
        setInspectedDraft,
    };
};
