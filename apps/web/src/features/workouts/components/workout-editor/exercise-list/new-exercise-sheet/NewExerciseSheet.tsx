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
import { useRef } from "react";
import { useExercises } from "@/features/workouts/hooks/useExercises.ts";
import { Spinner } from "@/components/ui/spinner.tsx";
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
        handleOpenChange,
        handleSearchChange,
        handleMuscleGroupSelect,
        handleExerciseClick,
        handleAddSelected
    } = actions;

    const contentRef = useRef<HTMLDivElement>(null);

    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetTrigger asChild>
                <Button variant="outline" className="w-full h-14 border-dashed rounded-xl gap-2 font-medium">
                    <Plus data-icon="inline-start" />
                    Novo Exercício
                </Button>
            </SheetTrigger>
            <SheetContent
                ref={contentRef}
                side="bottom"
                // tabIndex explícito: sem ele o focus() abaixo é um no-op silencioso num
                // <div>. O FocusScope do Radix injeta tabIndex={-1} por asChild, mas
                // depender dessa ordem de merge é o tipo de coisa que quebra sem aviso —
                // e um focus() que falha deixa o input que estava focado ANTES da sheet
                // sem blur, ou seja, o teclado continua aberto.
                tabIndex={-1}
                // O FocusScope foca o primeiro elemento tabbable, que é o campo de busca —
                // no mobile isso abre o teclado e cobre justamente a lista que o usuário
                // veio olhar. Focamos o container no lugar; Esc continua funcionando e
                // quem usa teclado físico não fica preso fora do diálogo.
                onOpenAutoFocus={(e) => {
                    e.preventDefault();
                    // Blur explícito: se a sheet foi aberta com o teclado já em pé (vindo
                    // dos campos de séries/reps do editor), impedir o autofocus não fecha
                    // nada — o input anterior continua focado. Só o blur derruba o teclado.
                    (document.activeElement as HTMLElement | null)?.blur();
                    contentRef.current?.focus();
                }}
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

                {/* Fica FORA da área de rolagem de propósito. Dentro dela, a linha de
                    chips era o primeiro filho de uma lista muito mais alta que a tela:
                    quem rolava até achar o exercício e tocava nele já estava a centenas
                    de pixels abaixo dos chips, que ficavam permanentemente fora de vista.
                    O sintoma ("os chips não aparecem") não era altura zero — era posição. */}
                <SelectedExercisesList
                    selectedExercises={selectedExercises}
                    onExerciseClick={handleExerciseClick}
                />

                <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-6 py-4 flex flex-col gap-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-12">
                            <Spinner className="size-5 text-muted-foreground" />
                            <p className="text-[13px] text-muted-foreground">Carregando exercícios</p>
                        </div>
                    ) : (
                        <SheetExerciseList
                            exercises={filteredExercises}
                            selectedExercises={selectedExercises}
                            onExerciseClick={handleExerciseClick}
                        />
                    )}
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
                        {selectedExercises.length > 0
                            ? `Adicionar ${selectedExercises.length} ${selectedExercises.length === 1 ? "exercício" : "exercícios"}`
                            : "Adicionar exercícios"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};

export default NewExerciseSheet;
