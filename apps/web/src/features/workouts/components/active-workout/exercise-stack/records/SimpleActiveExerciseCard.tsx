import { motion } from "framer-motion";
import { Check, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { MuscleBadge } from "@/core/components/MuscleBadge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AlternativesSheet from "@/features/workouts/components/workout-editor/AlternativesSheet.tsx";
import { useSimpleExerciseCardLogic } from "@/features/workouts/hooks/useSimpleExerciseCardLogic.ts";
import type { EnrichedExerciseRecord } from "@/features/workouts/workout.types.ts";
import { UNITS } from "@/core/constants/units.ts";
import SessionGroupBadge from "../../components/SessionGroupBadge";
import ExerciseWeightField from "./ExerciseWeightField";

type SimpleActiveExerciseCardProps = {
    record: EnrichedExerciseRecord;
    sessionId: number;
    lastWeight?: number;
};

const SimpleActiveExerciseCard = ({ record, sessionId, lastWeight }: SimpleActiveExerciseCardProps) => {
    const {
        activeSetNumber,
        showWeight,
        weight,
        handleDone,
        canChangePlan,
        alternativesOpen,
        openAlternatives,
        closeAlternatives,
        handleSubstitute,
        handleSkip,
        isChangingPlan,
    } = useSimpleExerciseCardLogic(record, sessionId);

    return (
        <motion.div
            layout
            data-keyboard-anchor
            className="border-2 border-primary/40 rounded-xl bg-card p-4 flex flex-col gap-4"
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-base font-medium tracking-[-0.02em] text-foreground">
                        {record.exercise.name}
                    </span>
                    <div className="flex items-center flex-wrap gap-2">
                        <MuscleBadge muscle={record.exercise.targetMuscle} />
                        <SessionGroupBadge group={record.group} />
                    </div>
                </div>

                {canChangePlan && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                aria-label="Mais opções"
                                className="relative tap-target text-muted-foreground p-1 hover:text-foreground transition-colors flex-shrink-0 mt-0.5"
                            >
                                <MoreHorizontal className="size-5" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={openAlternatives} disabled={isChangingPlan}>
                                Trocar exercício
                            </DropdownMenuItem>
                            {record.logs.length === 0 && (
                                <DropdownMenuItem onSelect={handleSkip} disabled={isChangingPlan}>
                                    Pular exercício
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            <div className="flex items-center justify-between gap-3">
                <div
                    className="flex items-center gap-2"
                    role="img"
                    aria-label={`${record.logs.length} de ${record.effectiveTargetSets} séries feitas`}
                >
                    {Array.from({ length: record.effectiveTargetSets }).map((_, idx) => (
                        <div
                            key={idx}
                            className={cn(
                                "w-2.5 h-2.5 rounded-full transition-colors",
                                idx < record.logs.length
                                    ? "bg-success"
                                    : idx === record.logs.length
                                        ? "bg-primary"
                                        : "bg-muted"
                            )}
                        />
                    ))}
                </div>
                <span className="text-[13px] text-muted-foreground tabular-nums">
                    {record.effectiveTargetSets} × {record.targetReps}
                </span>
            </div>

            {showWeight && (
                <ExerciseWeightField
                    id={`weight-${record.exerciseId}`}
                    value={weight.value}
                    onChange={weight.handleChange}
                    lastWeight={lastWeight}
                />
            )}

            <motion.button
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                onClick={handleDone}
                className="btn-session-confirm"
            >
                <span className="flex items-center justify-center gap-2">
                    <Check className="size-5" />
                    Concluir {UNITS.SINGLE_SET} {activeSetNumber}
                </span>
            </motion.button>

            <AlternativesSheet
                target={alternativesOpen ? record.exercise : null}
                onClose={closeAlternatives}
                onSelect={handleSubstitute}
                isPending={isChangingPlan}
            />
        </motion.div>
    );
};

export default SimpleActiveExerciseCard;
