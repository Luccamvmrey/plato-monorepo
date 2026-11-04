import { motion, type Variants } from "framer-motion";
import DeviationBadge from "@/features/workouts/components/DeviationBadge";
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
        <motion.section variants={staggerItem} className="bg-card border border-border rounded-xl">
            <h2 className="px-4 pt-4 pb-2 text-[15px] font-medium tracking-[-0.02em]">Exercícios</h2>

            <ul className="px-4 pb-1">
                {exercises.map((ex) => (
                    <li key={ex.id} className="flex flex-col gap-0.5 py-3 border-t border-border">
                        <div className="flex items-center gap-3">
                            <span className="text-[14px] flex-1 min-w-0 truncate">{ex.name}</span>
                            {ex.deviation && <DeviationBadge kind={ex.deviation.kind} />}
                            <span className="text-[13px] text-muted-foreground tabular-nums shrink-0">
                                {ex.sets} × {ex.reps}
                            </span>
                        </div>
                        {/* Segunda linha: texto longo aqui não tira largura do nome. */}
                        {ex.deviation?.replacedName && (
                            <p className="text-[12px] text-muted-foreground">no lugar de {ex.deviation.replacedName}</p>
                        )}
                    </li>
                ))}

                {/* Prescrito e não executado. Só aparece em sessão com snapshot — é a
                    informação que nenhuma lista derivada de séries conseguia ter. */}
                {unexecuted.map((ex) => (
                    <li key={`${ex.kind}-${ex.exerciseId}`} className="flex flex-col gap-0.5 py-3 border-t border-border">
                        <div className="flex items-center gap-3">
                            <span className="text-[14px] text-muted-foreground flex-1 min-w-0 truncate">{ex.name}</span>
                            <DeviationBadge kind={ex.kind} />
                        </div>
                        {ex.replacedByName && (
                            <p className="text-[12px] text-muted-foreground">por {ex.replacedByName}</p>
                        )}
                    </li>
                ))}
            </ul>
        </motion.section>
    );
};

export default SummaryExerciseList;
