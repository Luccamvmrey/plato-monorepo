import type { Exercise } from "@/features/workouts/workout.types.ts";
import { MuscleGroup } from "@plato/database/generated/prisma/enums.ts";
import { muscleGroupTranslation } from "@/core/utils/translations.ts";
import { cn } from "@/lib/utils.ts";

type SheetExerciseListProps = {
    exercises: Exercise[]
    selectedExercises: Exercise[];
    onExerciseClick: (exercise: Exercise) => void;
};

const SheetExerciseList = ({ exercises, selectedExercises, onExerciseClick }: SheetExerciseListProps) => {
    const groups = Object.values(MuscleGroup);

    const groupedExercises = groups.map((group) => {
        const exercisesForGroup = exercises?.filter(exercise => exercise.targetMuscle === group) || [];
        return {
            group,
            exercises: exercisesForGroup
        };
    });

    return (
        <div className="flex flex-col rounded-lg gap-2 overflow-y-auto no-scrollbar h-60">
            {groupedExercises.map((exerciseGroup) => {
                if (exerciseGroup.exercises.length === 0) return null;

                const groupName = muscleGroupTranslation[exerciseGroup.group];
                const groupExercises = exerciseGroup.exercises;

                return (
                    <div key={exerciseGroup.group} className="flex flex-col gap-2 mb-2">
                        <span className="text-lg text-muted-foreground border-b">{groupName}</span>

                        {groupExercises.map((gExercise) => (
                            <div
                                key={gExercise.id}
                                className={cn(
                                    "flex justify-between rounded-lg p-3 border transition-colors cursor-pointer",
                                    selectedExercises.some((ex) => ex.id === gExercise.id)
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-card text-card-foreground"
                                )}
                                onClick={() => onExerciseClick(gExercise)}
                            >
                                <span className="font-medium">{gExercise.name}</span>
                            </div>
                        ))}
                    </div>
                )
            })}
        </div>
    );
};

export default SheetExerciseList;