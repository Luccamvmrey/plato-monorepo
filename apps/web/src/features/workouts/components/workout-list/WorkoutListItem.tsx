import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import type { Workout } from "@/features/workouts/workout.types.ts";
import type { ProgramCycleEntry } from "@/features/workouts/program.types.ts";
import { Button } from "@/components/ui/button.tsx";
import { Archive, Play, SquarePen, Undo2 } from "lucide-react";
import { formatDaysAgo } from "@/core/utils/formatters.ts";
import { Spinner } from "@/components/ui/spinner.tsx";
import { MuscleBadge } from "@/core/components/MuscleBadge";
import { useWorkoutListItemLogic } from "@/features/workouts/hooks/useWorkoutListItemLogic.ts";
import { InlineErrorBanner } from "@/core/components/InlineErrorBanner";
import { cn } from "@/lib/utils.ts";

type WorkoutListItemProps = {
    workout: Workout;
    isLastDone?: boolean;
    /** Posição deste treino no ciclo do programa ativo, quando ele pertence a um. */
    cycleEntry?: ProgramCycleEntry;
    cycleTotal?: number;
};

const WorkoutListItem = ({ workout, isLastDone, cycleEntry, cycleTotal }: WorkoutListItemProps) => {
    const {
        handleEdit,
        handleQuickStart,
        handleToggleStatus,
        isLoading,
        isResumingSession,
        isPending,
        conflictError,
        createError,
    } = useWorkoutListItemLogic(workout);

    const inlineError = conflictError ?? createError;

    const isNext = cycleEntry?.isNext ?? false;

    return (
        <Card className={cn(
            "relative overflow-hidden bg-card shadow-none transition-all",
            // O destaque é a borda, não o fundo: o card já carrega a lista de
            // exercícios, e um fundo tingido brigaria com os badges de músculo.
            isNext && "border-primary/40"
        )}>
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <CardTitle className="text-lg font-medium tracking-tight">
                            {workout.name}
                        </CardTitle>
                        {cycleEntry && (
                            <p className="text-xs text-muted-foreground tabular-nums">
                                {cycleEntry.position}
                                {cycleTotal ? ` de ${cycleTotal}` : ""}
                                {" · "}
                                {formatDaysAgo(cycleEntry.lastCompletedAt)}
                            </p>
                        )}
                        {workout.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                                {workout.description}
                            </p>
                        )}
                    </div>
                    {isNext && (
                        <span className="text-[10px] font-medium uppercase tracking-wider text-primary px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 shrink-0">
                            Próximo
                        </span>
                    )}
                    {/* "Último Realizado" e "Próximo" só coincidem em programa de um
                        treino só; nesse caso "Próximo" é a informação acionável. */}
                    {isLastDone && !isNext && (
                        <span className="text-[10px] font-medium uppercase tracking-wider text-success px-2 py-0.5 rounded-full bg-success/10 border border-success/20">
                            Último Realizado
                        </span>
                    )}
                    {!workout.isActive && (
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                            Arquivado
                        </span>
                    )}
                </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-1.5 pb-2">
                <div className="flex flex-col gap-1">
                    {workout.workoutExercise.map((wEx) => (
                        <div
                            className="flex flex-row items-center justify-between gap-2 text-sm"
                            key={wEx.id}
                        >
                            <span className="flex-1 truncate text-foreground/90 font-normal tracking-tight">
                                {wEx.exercise!.name}
                            </span>
                            <div className="flex items-center gap-2">
                                <MuscleBadge muscle={wEx.exercise!.targetMuscle} className="scale-90 origin-right" />
                                <span className="text-xs font-medium text-muted-foreground tabular-nums min-w-[45px] text-right">
                                    {wEx.targetSets} × {wEx.targetReps}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>

            {inlineError && (
                <div className="px-4 pb-2">
                    <InlineErrorBanner message={inlineError} />
                </div>
            )}

            <CardFooter className="flex flex-row items-center justify-between gap-2 bg-transparent pt-2 border-t border-border/50">
                {/* gap-2, não gap-1: com .tap-target cada botão passa a ter 44px de
                    área de toque sobre 36px visuais, então 4px de gap fazia os dois
                    alvos se sobreporem — o de cima ganharia os toques do outro. */}
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-9 text-muted-foreground relative tap-target"
                        onClick={handleToggleStatus}
                        disabled={isPending}
                        aria-label={workout.isActive ? "Arquivar treino" : "Reativar treino"}
                    >
                        {workout.isActive ? <Archive data-icon="inline" /> : <Undo2 data-icon="inline" />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-9 text-muted-foreground relative tap-target"
                        onClick={handleEdit}
                        aria-label="Editar treino"
                    >
                        <SquarePen data-icon="inline" />
                    </Button>
                </div>

                {workout.isActive && (
                    <Button
                        onClick={handleQuickStart}
                        disabled={isLoading || isPending}
                        variant={isResumingSession ? "secondary" : "default"}
                        className={cn(
                            "h-9 px-4 gap-2 font-medium tracking-tight relative tap-target",
                            isResumingSession && "border-primary/20 text-primary"
                        )}
                    >
                        {/* Era um LoadingOverlay `fixed inset-0` montado dentro do
                            card: iniciar a sessão em UM treino borrava o app
                            inteiro. O retorno pertence ao botão que foi tocado. */}
                        {isPending
                            ? <Spinner data-icon="inline-start" />
                            : <Play data-icon="inline-start" className={cn(!isResumingSession && "fill-current")} />}
                        {isResumingSession ? "Retomar" : "Iniciar"}
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
};

export default WorkoutListItem;
