import { findExerciseGroups } from "@plato/shared";
import { GROUP_TYPE_LABEL } from "@/features/workouts/utils/movement.ts";
import type { PublicSharedExercise, PublicSharedWorkout } from "@/features/sharing/sharing.types.ts";
import { cn } from "@/lib/utils.ts";

const formatTarget = ({ targetSets, targetReps, exercise }: PublicSharedExercise) =>
    `${targetSets} × ${targetReps}${exercise.repUnit === "SECONDS" ? " s" : ""}`;

type SharedWorkoutCardProps = {
    workout: PublicSharedWorkout;
    /** Num link de treino, o nome já é o título da página e repeti-lo só gastaria tela. */
    showHeader: boolean;
};

const SharedWorkoutCard = ({ workout, showHeader }: SharedWorkoutCardProps) => {
    const groups = findExerciseGroups(workout.exercises);
    const groupByIndex = new Map(groups.flatMap((run) => run.indexes.map((index) => [index, run] as const)));

    return (
        <section className="rounded-xl bg-card border border-border">
            {showHeader && (
                <header className="px-4 pt-4 pb-3">
                    <h2 className="text-[17px] font-semibold tracking-[-0.02em] leading-tight">{workout.name}</h2>
                    {workout.description && (
                        <p className="text-[13px] text-muted-foreground mt-1">{workout.description}</p>
                    )}
                </header>
            )}

            <ul className={cn("px-4 pb-2", !showHeader && "pt-2 [&>li:first-child]:border-t-0")}>
                {workout.exercises.map((item, index) => {
                    const group = groupByIndex.get(index);
                    const isGroupStart = group?.indexes[0] === index;

                    return (
                        <li
                            key={item.orderIndex}
                            className={cn("py-2.5 border-t border-border", group && "border-l-2 border-l-primary/50 pl-3")}
                        >
                            {isGroupStart && (
                                <p className="text-[13px] font-medium text-primary mb-1">
                                    {GROUP_TYPE_LABEL[group.groupType] ?? "Grupo"}
                                </p>
                            )}
                            <div className="flex items-baseline gap-3 text-[14px]">
                                <span className="flex-1 min-w-0">{item.exercise.name}</span>
                                <span className="text-[13px] text-muted-foreground tabular-nums shrink-0">
                                    {formatTarget(item)}
                                </span>
                            </div>
                            {item.observation && (
                                <p className="text-[13px] text-muted-foreground mt-1">{item.observation}</p>
                            )}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
};

export default SharedWorkoutCard;
