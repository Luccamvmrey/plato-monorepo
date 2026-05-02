import { useLocation, useParams } from "wouter";
import { useWorkouts } from "./useWorkouts";
import { useWorkoutEditorStore } from "@/features/workouts/stores/workout-editor.store";
import { useSensor, useSensors, type DragEndEvent, closestCenter, TouchSensor, MouseSensor } from "@dnd-kit/core";
import { type FormEvent, useEffect, useState } from "react";
import { path } from "@/core/constants/path";
import { useSuccessState } from "@/core/hooks/useSuccessState";

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

        return () => reset();
    }, [workout, loadWorkout, reset]);

    const sensors = useSensors(
        useSensor(MouseSensor),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        })
    );

    const handleNameBlur = (value: string) => {
        if (!value.trim()) {
            setValidationErrors(prev => ({ ...prev, name: "O nome do treino é obrigatório." }));
        } else {
            setValidationErrors(prev => { const next = { ...prev }; delete next.name; return next; });
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        setValidationErrors({});

        if (!name.trim()) { setValidationErrors({ name: "O nome do treino é obrigatório." }); return; }
        if (exercises.length === 0) { setValidationErrors({ exercises: "Adicione pelo menos um exercício." }); return; }
        if (exercises.some((ex) => ex.targetSets === 0 || ex.targetReps === 0)) {
            setValidationErrors({ exercises: "Defina as séries e repetições para todos os exercícios." });
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
        handleDragEnd,
        handleDragStart,
        collisionDetection: closestCenter,
    };
};
