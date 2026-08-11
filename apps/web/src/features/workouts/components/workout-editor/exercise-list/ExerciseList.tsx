import ExerciseItem from "@/features/workouts/components/workout-editor/exercise-list/ExerciseItem.tsx";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useExerciseListLogic } from "@/features/workouts/hooks/useExerciseListLogic";

const ExerciseList = () => {
    const { exercises, membership } = useExerciseListLogic();

    return (
        <div className="flex flex-col gap-3 mt-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider ml-1">Exercícios</span>
            <div className="flex flex-col gap-2">
                <SortableContext
                    items={exercises.map(e => e.instanceId)}
                    strategy={verticalListSortingStrategy}
                >
                    {exercises.length !== 0 ? exercises.map((exercise, index) => (
                        <ExerciseItem
                            key={exercise.instanceId}
                            exercise={exercise}
                            membership={membership[index]}
                            canGroupWithNext={index < exercises.length - 1}
                        />
                    )) : (
                        <div className="py-12 border-2 border-dashed border-border rounded-xl flex items-center justify-center">
                            <span className="text-muted-foreground text-sm">Nenhum exercício adicionado</span>
                        </div>
                    )}
                </SortableContext>
            </div>
        </div>
    );
};

export default ExerciseList;