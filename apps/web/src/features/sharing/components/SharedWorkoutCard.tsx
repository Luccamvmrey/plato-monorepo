import { buildGroupMembership } from "@plato/shared";
import ExerciseGroupChip from "@/features/workouts/components/workout-editor/exercise-list/ExerciseGroupChip.tsx";
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
    const membership = buildGroupMembership(workout.exercises);

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
                    const group = membership[index];

                    return (
                        <li key={item.orderIndex} className="py-2.5 border-t border-border">
                            {/* O mesmo cabeçalho e a mesma posição do editor: bi-set se lê igual em todo o app. */}
                            {group?.isFirst && (
                                <div className="mb-2">
                                    <ExerciseGroupChip groupType={group.groupType} size={group.size} />
                                </div>
                            )}
                            <div className="flex items-baseline gap-3 text-[14px]">
                                <span className="flex-1 min-w-0">
                                    {group && (
                                        <span className="text-muted-foreground tabular-nums mr-1.5">
                                            {group.position + 1}/{group.size}
                                        </span>
                                    )}
                                    {item.exercise.name}
                                </span>
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
