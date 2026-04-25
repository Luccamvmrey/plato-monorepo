import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger
} from "@/components/ui/sheet.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Plus } from "lucide-react";
import { useExercises } from "@/features/workouts/hooks/useExercises.ts";
import { LoadingOverlay } from "@/components/ui/loading-overlay.tsx";
import ExerciseSearchBar
    from "@/features/workouts/components/workout-editor/exercise-list/new-exercise-sheet/ExerciseSearchBar.tsx";
import MuscleGroupFilter
    from "@/features/workouts/components/workout-editor/exercise-list/new-exercise-sheet/MuscleGroupFilter.tsx";
import SheetExerciseList
    from "@/features/workouts/components/workout-editor/exercise-list/new-exercise-sheet/SheetExerciseList.tsx";
import SelectedExercisesList
    from "@/features/workouts/components/workout-editor/exercise-list/new-exercise-sheet/SelectedExercisesList.tsx";
import { useNewExerciseSheet } from "@/features/workouts/hooks/useNewExerciseSheet.ts";

const NewExerciseSheet = () => {
    const { exercisesQuery } = useExercises();
    const { data: exercises, isLoading } = exercisesQuery;

    const { state, actions } = useNewExerciseSheet(exercises);

    const {
        open,
        searchValue,
        selectedMuscleGroup,
        selectedExercises,
        filteredExercises
    } = state;

    const {
        setOpen,
        handleSearchChange,
        handleMuscleGroupSelect,
        handleExerciseClick,
        handleAddSelected
    } = actions;

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="py-6" asChild>
                <Button className="rounded-xl" variant="outline">
                    <Plus/>
                    Novo Exercício
                </Button>
            </SheetTrigger>
            <SheetContent side="bottom">
                <SheetHeader>
                    <SheetTitle>
                        Novo Exercício
                    </SheetTitle>
                    <SheetDescription>
                        Adicione um novo exercício ao seu treino.
                    </SheetDescription>
                </SheetHeader>

                <div className="px-4 flex flex-col gap-4">
                    <ExerciseSearchBar
                        onChange={handleSearchChange}
                        value={searchValue}
                    />

                    <MuscleGroupFilter
                        selectedMuscleGroup={selectedMuscleGroup}
                        onSelectMuscleGroup={handleMuscleGroupSelect}
                    />

                    <SelectedExercisesList
                        selectedExercises={selectedExercises}
                        onExerciseClick={handleExerciseClick}
                    />

                    <SheetExerciseList
                        exercises={filteredExercises}
                        selectedExercises={selectedExercises}
                        onExerciseClick={handleExerciseClick}
                    />
                </div>

                <SheetFooter>
                    <Button
                        type="button"
                        className="p-5"
                        onClick={handleAddSelected}
                        disabled={selectedExercises.length === 0}
                    >
                        Adicionar {selectedExercises.length} exercícios
                    </Button>
                    <SheetClose asChild>
                        <Button variant="outline" className="p-5">Cancelar</Button>
                    </SheetClose>
                </SheetFooter>
            </SheetContent>

            <LoadingOverlay isLoading={isLoading}/>
        </Sheet>
    );
};

export default NewExerciseSheet;
