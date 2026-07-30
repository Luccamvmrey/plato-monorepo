import { useState } from "react";
import type { Exercise } from "@/features/workouts/workout.types.ts";
import { useWorkoutEditorStore } from "@/features/workouts/stores/workout-editor.store.ts";

export const useNewExerciseSheet = (exercises: Exercise[] | undefined) => {
    const addExercises = useWorkoutEditorStore(state => state.addExercises);

    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [selectedMuscleGroup, setSelectedMuscleGroup] = useState("ALL");
    const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);

    const handleSearchChange = (value: string) => {
        setSearchValue(value);
    }

    const handleMuscleGroupSelect = (muscleGroup: string) => {
        setSelectedMuscleGroup(muscleGroup);
    }

    const handleExerciseClick = (exercise: Exercise) => {
        if (selectedExercises.some(e => e.id === exercise.id)) {
            setSelectedExercises(prev => prev.filter(e => e.id !== exercise.id));
        } else {
            setSelectedExercises(prev => [...prev, exercise]);
        }
    }

    const filteredExercises = (exercises || []).filter(exercise => {
        const matchesMuscle = selectedMuscleGroup === "ALL" || exercise.targetMuscle === selectedMuscleGroup;
        const matchesSearch = searchValue.trim() === "" || 
            exercise.name.toLowerCase().includes(searchValue.toLowerCase());
        return matchesMuscle && matchesSearch;
    });

    const handleAddSelected = () => {
        addExercises(selectedExercises);
        handleCloseSheet();
    }

    const handleCloseSheet = () => {
        setSelectedExercises([]);
        setSearchValue("");
        setSelectedMuscleGroup("ALL");
        setOpen(false);
    }

    // Todo caminho de saída passa por aqui — Cancelar, X, Esc e clique no overlay.
    // Ligar o onOpenChange direto no setOpen deixava seleções, busca e filtro de
    // músculo vazarem para a próxima abertura da sheet.
    const handleOpenChange = (next: boolean) => {
        if (next) {
            setOpen(true);
            return;
        }
        handleCloseSheet();
    }

    return {
        state: {
            open,
            searchValue,
            selectedMuscleGroup,
            selectedExercises,
            filteredExercises
        },
        actions: {
            setOpen,
            handleOpenChange,
            handleSearchChange,
            handleMuscleGroupSelect,
            handleExerciseClick,
            handleAddSelected,
            handleCloseSheet
        }
    };
};
