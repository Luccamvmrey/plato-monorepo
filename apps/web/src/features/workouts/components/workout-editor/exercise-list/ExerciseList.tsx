import ExerciseItem from "@/features/workouts/components/workout-editor/exercise-list/ExerciseItem.tsx";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useExerciseListLogic } from "@/features/workouts/hooks/useExerciseListLogic";

const ExerciseList = () => {
    const { exercises, membership } = useExerciseListLogic();

    const totalSets = exercises.reduce((sum, exercise) => sum + exercise.targetSets, 0);

    return (
        <div className="flex flex-col gap-2 mt-2">
            <div className="flex items-baseline justify-between gap-3 px-1">
                <h2 className="text-[17px] font-semibold tracking-[-0.02em]">Exercícios</h2>
                {exercises.length > 0 && (
                    <span className="text-[13px] text-muted-foreground tabular-nums">
                        {exercises.length} · {totalSets} {totalSets === 1 ? "série" : "séries"}
                    </span>
                )}
            </div>
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
