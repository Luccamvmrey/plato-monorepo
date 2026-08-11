import { motion, type Variants } from "framer-motion";
import { MuscleBadge } from "@/core/components/MuscleBadge";
import DeviationBadge from "@/features/workouts/components/DeviationBadge";
import { cn } from "@/lib/utils";
import type { SummaryStats } from "@/features/workouts/hooks/useWorkoutSummaryStats";

const staggerItem: Variants = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 380, damping: 28 } },
};

type Props = {
    exercises: SummaryStats["completedExercises"];
    unexecuted?: SummaryStats["unexecuted"];
};

const SummaryExerciseList = ({ exercises, unexecuted = [] }: Props) => {
    if (exercises.length === 0 && unexecuted.length === 0) return null;

    return (
        <motion.div
            variants={staggerItem}
            className="mx-4 mb-4 bg-card border border-border rounded-xl overflow-hidden"
        >
            <div className="px-4 py-3 border-b border-border">
                <p className="text-[13px] font-medium text-foreground">Exercícios realizados</p>
            </div>
            {exercises.map((ex, i) => (
                <div
                    key={ex.id}
                    className={cn(
                        "flex items-center gap-3 px-4 py-3",
                        i < exercises.length - 1 && "border-b border-border"
                    )}
                >
                    <span className="text-[13px] text-foreground flex-1 min-w-0 truncate">
                        {ex.name}
                    </span>
                    {ex.deviation && (
                        <DeviationBadge kind={ex.deviation.kind} relatedName={ex.deviation.replacedName} />
                    )}
                    <MuscleBadge muscle={ex.muscleGroup} />
                    <span className="text-[12px] text-muted-foreground ml-2 flex-shrink-0">
                        {ex.sets}×{ex.reps}
                    </span>
                </div>
            ))}

            {/* Prescrito e não executado. Só aparece em sessão com snapshot — é a
                informação que nenhuma lista derivada de séries conseguia ter. */}
            {unexecuted.length > 0 && (
                <div className="border-t border-border">
                    {unexecuted.map((ex) => (
                        <div
                            key={`${ex.kind}-${ex.exerciseId}`}
                            className="flex items-center gap-3 px-4 py-3"
                        >
                            <span className="text-[13px] text-muted-foreground flex-1 min-w-0 truncate">
                                {ex.name}
                            </span>
                            <DeviationBadge kind={ex.kind} relatedName={ex.replacedByName} />
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
};

export default SummaryExerciseList;
