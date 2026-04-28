import {
    Sheet,
    SheetClose,
    SheetContent,
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
            <SheetTrigger asChild>
                <Button variant="outline" className="w-full h-14 border-dashed rounded-xl gap-2 font-medium">
                    <Plus data-icon="inline-start" />
                    Novo Exercício
                </Button>
            </SheetTrigger>
            <SheetContent 
                side="bottom" 
                className="h-[90dvh] max-h-[90dvh] p-0 flex flex-col outline-none border-t border-border rounded-t-3xl overflow-hidden"
            >
                <SheetHeader className="px-6 pt-6 pb-4 space-y-4 border-b border-border/50 shrink-0 bg-background z-10">
                    <div className="flex flex-col gap-1">
                        <SheetTitle className="text-xl font-medium tracking-tight text-left">
                            Adicionar Exercícios
                        </SheetTitle>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                        <ExerciseSearchBar
                            onChange={handleSearchChange}
                            value={searchValue}
                        />

                        <MuscleGroupFilter
                            selectedMuscleGroup={selectedMuscleGroup}
                            onSelectMuscleGroup={handleMuscleGroupSelect}
                        />
                    </div>
                </SheetHeader>

                <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-6 py-4 flex flex-col gap-4">
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

                <SheetFooter className="p-6 border-t border-border/50 bg-background shrink-0 flex-row items-center justify-between gap-4 mt-auto">
                    <SheetClose asChild>
                        <Button variant="ghost" className="h-12 flex-1">Cancelar</Button>
                    </SheetClose>
                    <Button
                        type="button"
                        className="h-12 flex-[2] font-medium"
                        onClick={handleAddSelected}
                        disabled={selectedExercises.length === 0}
                    >
                        Adicionar {selectedExercises.length > 0 ? selectedExercises.length : ""} 
                        {selectedExercises.length === 1 ? " exercício" : " exercícios"}
                    </Button>
                </SheetFooter>
            </SheetContent>

            <LoadingOverlay isLoading={isLoading}/>
        </Sheet>
    );
};

export default NewExerciseSheet;
