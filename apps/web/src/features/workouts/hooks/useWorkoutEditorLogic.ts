import { useLocation, useParams } from "wouter";
import { useWorkouts } from "./useWorkouts";
import { useWorkoutEditorStore } from "@/features/workouts/stores/workout-editor.store";
import { useSensor, useSensors, type DragEndEvent, closestCenter, TouchSensor, MouseSensor } from "@dnd-kit/core";
import { type FormEvent, useEffect } from "react";
import { toast } from "sonner";
import { path } from "@/core/constants/path";

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
            // Press and hold for 250ms to start dragging, allowing for scrolling
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        })
    );

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return toast.error("O nome do treino é obrigatório.");
        if (exercises.length === 0) return toast.error("Adicione pelo menos um exercício.");
        if (exercises.some((ex) => ex.targetSets === 0 || ex.targetReps === 0))
            return toast.error("Defina as séries e repetições para todos os exercícios.");

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

        if (id && id !== "new") {
            await updateWorkoutMutation.mutateAsync({ id, payload });
        } else {
            await createWorkoutMutation.mutateAsync(payload);
        }
        reset();
        navigate(path.WORKOUTS);
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
        sensors,
        handleSubmit,
        handleDragEnd,
        handleDragStart,
        collisionDetection: closestCenter,
    };
};
