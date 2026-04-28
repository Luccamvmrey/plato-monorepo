import type { Exercise } from "@/features/workouts/workout.types.ts";
import { MuscleGroup } from "@plato/database/generated/prisma/enums.ts";
import { muscleGroupTranslation } from "@/core/utils/translations.ts";
import { cn } from "@/lib/utils.ts";
import { MuscleBadge } from "@/core/components/MuscleBadge.tsx";

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
        <div className="flex flex-col gap-6">
            {groupedExercises.map((exerciseGroup) => {
                if (exerciseGroup.exercises.length === 0) return null;

                const groupName = muscleGroupTranslation[exerciseGroup.group];
                const groupExercises = exerciseGroup.exercises;

                return (
                    <div key={exerciseGroup.group} className="flex flex-col gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">
                            {groupName}
                        </span>

                        <div className="flex flex-col gap-1">
                            {groupExercises.map((gExercise) => {
                                const isSelected = selectedExercises.some((ex) => ex.id === gExercise.id);
                                return (
                                    <div
                                        key={gExercise.id}
                                        className={cn(
                                            "flex items-center justify-between gap-4 rounded-xl p-3 px-4 transition-all cursor-pointer border border-transparent",
                                            isSelected
                                                ? "bg-primary/10 border-primary/20 text-primary"
                                                : "bg-muted/30 hover:bg-muted/50 text-foreground"
                                        )}
                                        onClick={() => onExerciseClick(gExercise)}
                                    >
                                        <span className="font-medium tracking-tight leading-tight flex-1 text-sm">
                                            {gExercise.name}
                                        </span>
                                        <MuscleBadge 
                                            muscle={gExercise.targetMuscle} 
                                            className={cn("scale-90 origin-right shrink-0", isSelected && "bg-primary/20 text-primary")}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )
            })}
        </div>
    );
};

export default SheetExerciseList;