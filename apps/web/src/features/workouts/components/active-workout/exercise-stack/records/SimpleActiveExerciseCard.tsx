import { motion } from "framer-motion";
import { MoreHorizontal } from "lucide-react";
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
import SessionGroupBadge from "../../components/SessionGroupBadge";
import ExerciseWeightField from "./ExerciseWeightField";
import SetTiles from "./SetTiles";
import SkipExerciseButton from "./SkipExerciseButton";

type SimpleActiveExerciseCardProps = {
    record: EnrichedExerciseRecord;
    sessionId: number;
    lastWeight?: number;
};

const SimpleActiveExerciseCard = ({ record, sessionId, lastWeight }: SimpleActiveExerciseCardProps) => {
    const {
        repLabel,
        showWeight,
        weight,
        handleDone,
        handleUndo,
        canChangePlan,
        alternativesOpen,
        openAlternatives,
        closeAlternatives,
        handleSubstitute,
        handleSkip,
        isChangingPlan,
    } = useSimpleExerciseCardLogic(record, sessionId, lastWeight);

    return (
        <motion.div
            layout
            data-keyboard-anchor
            className="border-2 border-primary/40 rounded-xl bg-card p-4 flex flex-col gap-4"
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-2 min-w-0">
                    <h2 className="text-[20px] font-semibold tracking-[-0.02em] leading-tight text-foreground">
                        {record.exercise.name}
                    </h2>
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
                                className="relative tap-target text-muted-foreground p-1 hover:text-foreground transition-colors flex-shrink-0"
                            >
                                <MoreHorizontal className="size-5" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={openAlternatives} disabled={isChangingPlan}>
                                Trocar exercício
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            <SetTiles
                total={record.effectiveTargetSets}
                done={record.logs.length}
                repLabel={repLabel}
                onDone={handleDone}
                onUndo={handleUndo}
            />

            {showWeight && (
                <ExerciseWeightField
                    id={`weight-${record.exerciseId}`}
                    value={weight.value}
                    onChange={weight.handleChange}
                    onStep={weight.handleStep}
                    onRepeat={weight.handleRepeat}
                    lastWeight={lastWeight}
                />
            )}

            {/* Mesmo pular do modo completo, à vista em vez de no menu. */}
            {canChangePlan && record.logs.length === 0 && (
                <SkipExerciseButton onSkip={handleSkip} disabled={isChangingPlan} />
            )}

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
