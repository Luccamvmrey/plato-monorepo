import { useState } from "react";
import { Archive, ChevronDown, Play, SquarePen, Undo2 } from "lucide-react";
import type { Workout } from "@/features/workouts/workout.types.ts";
import type { ProgramCycleEntry } from "@/features/workouts/program.types.ts";
import { Button } from "@/components/ui/button.tsx";
import { formatDaysAgo } from "@/core/utils/formatters.ts";
import { muscleGroupTranslation } from "@/core/utils/translations";
import { Spinner } from "@/components/ui/spinner.tsx";
import { useWorkoutListItemLogic } from "@/features/workouts/hooks/useWorkoutListItemLogic.ts";
import { InlineErrorBanner } from "@/core/components/InlineErrorBanner";
import { cn } from "@/lib/utils.ts";
import { TrackingModeChoiceSheet } from "./TrackingModeChoiceSheet";

type WorkoutListItemProps = {
    workout: Workout;
    isLastDone?: boolean;
    /** Posição deste treino no ciclo do programa ativo, quando ele pertence a um. */
    cycleEntry?: ProgramCycleEntry;
    cycleTotal?: number;
    /** O próximo da rotação: o que a pessoa abriu o app para fazer. */
    isFeatured?: boolean;
    programName?: string;
};

const MAX_MUSCLES_SHOWN = 3;

/** Os grupos na ordem do treino: é assim que se reconhece um treino de relance. */
const musclesOf = (workout: Workout) => {
    const muscles = Array.from(new Set(
        [...workout.workoutExercise]
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .flatMap((item) => item.exercise ? [muscleGroupTranslation[item.exercise.targetMuscle]] : [])
    ));

    return muscles.slice(0, MAX_MUSCLES_SHOWN).join(", ") + (muscles.length > MAX_MUSCLES_SHOWN ? "…" : "");
};

const WorkoutListItem = ({ workout, isLastDone, cycleEntry, cycleTotal, isFeatured, programName }: WorkoutListItemProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const {
        handleEdit,
        handleQuickStart,
        handleToggleStatus,
        isLoading,
        isResumingSession,
        isPending,
        conflictError,
        createError,
        isChoosingMode,
        handleChooseMode,
        cancelChoosingMode,
    } = useWorkoutListItemLogic(workout);

    const inlineError = conflictError ?? createError;

    const totalSets = workout.workoutExercise.reduce((sum, item) => sum + item.targetSets, 0);
    const exercises = [...workout.workoutExercise].sort((a, b) => a.orderIndex - b.orderIndex);

    const meta = [
        `${exercises.length} ${exercises.length === 1 ? "exercício" : "exercícios"}`,
        `${totalSets} ${totalSets === 1 ? "série" : "séries"}`,
        cycleEntry ? formatDaysAgo(cycleEntry.lastCompletedAt) : isLastDone ? "último realizado" : null,
        workout.isActive ? null : "arquivado",
    ].filter(Boolean).join(" · ");

    const startLabel = isResumingSession ? "Retomar" : "Iniciar";

    const details = isOpen && (
        <div className="flex flex-col gap-3 px-4 pb-3">
            <ul>
                {exercises.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 py-2 border-t border-border text-[14px]">
                        <span className="flex-1 min-w-0 truncate">{item.exercise!.name}</span>
                        <span className="text-[13px] text-muted-foreground tabular-nums shrink-0">
                            {item.targetSets} × {item.targetReps}
                        </span>
                    </li>
                ))}
            </ul>

            <div className="flex items-center gap-2 -ml-2">
                <Button variant="ghost" className="h-10 px-2 gap-2 text-muted-foreground font-normal" onClick={handleEdit}>
                    <SquarePen data-icon="inline-start" />
                    Editar
                </Button>
                <Button
                    variant="ghost"
                    className="h-10 px-2 gap-2 text-muted-foreground font-normal"
                    onClick={handleToggleStatus}
                    disabled={isPending}
                >
                    {workout.isActive ? <Archive data-icon="inline-start" /> : <Undo2 data-icon="inline-start" />}
                    {workout.isActive ? "Arquivar" : "Reativar"}
                </Button>
            </div>
        </div>
    );

    const extras = (
        <>
            {inlineError && (
                <div className="px-4 pb-3">
                    <InlineErrorBanner message={inlineError} />
                </div>
            )}
            <TrackingModeChoiceSheet
                open={isChoosingMode}
                onCancel={cancelChoosingMode}
                onChoose={handleChooseMode}
            />
        </>
    );

    if (isFeatured) {
        return (
            <section aria-label="Próximo treino" className="rounded-xl bg-card border-2 border-primary/40">
                <div className="flex flex-col gap-3 p-4">
                    <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() => setIsOpen((open) => !open)}
                        className="flex items-start gap-3 text-left"
                    >
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-primary tabular-nums">
                                Próximo
                                {programName && <span className="font-normal text-muted-foreground"> · {programName}</span>}
                                {cycleEntry && cycleTotal && (
                                    <span className="font-normal text-muted-foreground"> · {cycleEntry.position} de {cycleTotal}</span>
                                )}
                            </p>
                            <h2 className="text-[24px] font-semibold tracking-[-0.03em] leading-tight mt-1">
                                {workout.name}
                            </h2>
                            <p className="text-[14px] text-muted-foreground mt-1">{musclesOf(workout)}</p>
                            <p className="text-[13px] text-muted-foreground mt-0.5 tabular-nums">{meta}</p>
                        </div>
                        <ChevronDown className={cn(
                            "size-4 mt-1 text-muted-foreground shrink-0 transition-transform duration-200",
                            isOpen && "rotate-180"
                        )} />
                    </button>

                    <Button
                        onClick={handleQuickStart}
                        disabled={isLoading || isPending}
                        className="w-full h-[52px] gap-2 text-[15px] font-medium tracking-[-0.01em]"
                    >
                        {/* O retorno pertence ao botão que foi tocado, não à tela inteira. */}
                        {isPending ? <Spinner data-icon="inline-start" /> : <Play data-icon="inline-start" className="fill-current" />}
                        {startLabel} treino
                    </Button>
                </div>
                {extras}
                {details}
            </section>
        );
    }

    return (
        <div className="rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 pr-3">
                <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setIsOpen((open) => !open)}
                    className="flex-1 min-w-0 flex items-center gap-2 pl-4 py-3 text-left min-h-16"
                >
                    <div className="flex-1 min-w-0">
                        <h3 className="text-[15px] font-medium tracking-[-0.02em] truncate">{workout.name}</h3>
                        <p className="text-[13px] text-muted-foreground truncate mt-0.5 tabular-nums">{meta}</p>
                    </div>
                    <ChevronDown className={cn(
                        "size-4 text-muted-foreground shrink-0 transition-transform duration-200",
                        isOpen && "rotate-180"
                    )} />
                </button>

                {workout.isActive && (
                    <Button
                        onClick={handleQuickStart}
                        disabled={isLoading || isPending}
                        variant={isResumingSession ? "default" : "secondary"}
                        className="h-10 px-3 shrink-0 font-medium"
                    >
                        {isPending && <Spinner data-icon="inline-start" />}
                        {startLabel}
                    </Button>
                )}
            </div>
            {extras}
            {details}
        </div>
    );
};

export default WorkoutListItem;
