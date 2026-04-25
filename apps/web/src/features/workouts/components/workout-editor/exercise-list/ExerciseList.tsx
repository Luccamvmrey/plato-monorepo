import ExerciseItem from "@/features/workouts/components/workout-editor/exercise-list/ExerciseItem.tsx";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useExerciseListLogic } from "@/features/workouts/hooks/useExerciseListLogic";

const ExerciseList = () => {
    const { exercises } = useExerciseListLogic();

    return (
        <div className="bg-card flex flex-col gap-4 p-4 rounded-xl border">
            <span className="font-semibold text-2xl">Exercícios</span>
            <div className="flex flex-col gap-2">
                <SortableContext
                    items={exercises.map(e => e.instanceId)}
                    strategy={verticalListSortingStrategy}
                >
                    {exercises.length !== 0 ? exercises.map((exercise) => (
                        <ExerciseItem
                            key={exercise.instanceId}
                            exercise={exercise}
                        />
                    )) : (
                        <span className="text-muted-foreground text-center">Nenhum exercício adicionado</span>
                    )}
                </SortableContext>
            </div>
        </div>
    );
};

export default ExerciseList;