import { useCallback, useDeferredValue, useMemo, useState } from "react";
import type { Exercise } from "@/features/workouts/workout.types.ts";
import { useWorkoutEditorStore } from "@/features/workouts/stores/workout-editor.store.ts";

export const useNewExerciseSheet = (exercises: Exercise[] | undefined) => {
    const addExercises = useWorkoutEditorStore(state => state.addExercises);

    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [selectedMuscleGroup, setSelectedMuscleGroup] = useState("ALL");
    const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);

    // O input continua controlado e instantâneo; só a filtragem da lista fica um
    // frame atrás. Resolve o mesmo que um debounce, sem timer e sem dependência
    // nova — e sem o atraso fixo que um debounce impõe mesmo quando dá tempo.
    const deferredSearch = useDeferredValue(searchValue);

    const handleSearchChange = useCallback((value: string) => {
        setSearchValue(value);
    }, []);

    const handleMuscleGroupSelect = useCallback((muscleGroup: string) => {
        setSelectedMuscleGroup(muscleGroup);
    }, []);

    const handleExerciseClick = useCallback((exercise: Exercise) => {
        setSelectedExercises(prev => prev.some(e => e.id === exercise.id)
            ? prev.filter(e => e.id !== exercise.id)
            : [...prev, exercise]
        );
    }, []);

    const filteredExercises = useMemo(() => {
        // toLowerCase() do termo é invariante do loop — ficava dentro do predicado,
        // recomputado uma vez por exercício.
        const term = deferredSearch.trim().toLowerCase();

        return (exercises || []).filter(exercise => {
            const matchesMuscle = selectedMuscleGroup === "ALL" || exercise.targetMuscle === selectedMuscleGroup;
            const matchesSearch = term === "" || exercise.name.toLowerCase().includes(term);
            return matchesMuscle && matchesSearch;
        });
    }, [exercises, deferredSearch, selectedMuscleGroup]);

    const handleCloseSheet = useCallback(() => {
        setSelectedExercises([]);
        setSearchValue("");
        setSelectedMuscleGroup("ALL");
        setOpen(false);
    }, []);

    const handleAddSelected = useCallback(() => {
        addExercises(selectedExercises);
        handleCloseSheet();
    }, [addExercises, selectedExercises, handleCloseSheet]);

    // Todo caminho de saída passa por aqui — Cancelar, X, Esc e clique no overlay.
    // Ligar o onOpenChange direto no setOpen deixava seleções, busca e filtro de
    // músculo vazarem para a próxima abertura da sheet.
    const handleOpenChange = useCallback((next: boolean) => {
        if (next) {
            setOpen(true);
            return;
        }
        handleCloseSheet();
    }, [handleCloseSheet]);

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
