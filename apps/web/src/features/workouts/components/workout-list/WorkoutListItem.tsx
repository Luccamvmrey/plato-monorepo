import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import type { Workout } from "@/features/workouts/workout.types.ts";
import { Button } from "@/components/ui/button.tsx";
import { Archive, Play, SquarePen, Undo2 } from "lucide-react";
import { LoadingOverlay } from "@/components/ui/loading-overlay.tsx";
import { MuscleBadge } from "@/core/components/MuscleBadge";
import { useWorkoutListItemLogic } from "@/features/workouts/hooks/useWorkoutListItemLogic.ts";
import { InlineErrorBanner } from "@/core/components/InlineErrorBanner";
import { cn } from "@/lib/utils.ts";

type WorkoutListItemProps = {
    workout: Workout;
    isLastDone?: boolean;
};

const WorkoutListItem = ({ workout, isLastDone }: WorkoutListItemProps) => {
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

    return (
        <Card className={cn(
            "relative overflow-hidden bg-card shadow-none transition-all"
        )}>
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <CardTitle className="text-lg font-medium tracking-tight">
                            {workout.name}
                        </CardTitle>
                        {workout.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                                {workout.description}
                            </p>
                        )}
                    </div>
                    {isLastDone && (
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
                <div className="flex gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-9 text-muted-foreground"
                        onClick={handleToggleStatus}
                        title={workout.isActive ? "Arquivar" : "Reativar"}
                    >
                        {workout.isActive ? <Archive data-icon="inline" /> : <Undo2 data-icon="inline" />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-9 text-muted-foreground"
                        onClick={handleEdit}
                    >
                        <SquarePen data-icon="inline" />
                    </Button>
                </div>

                {workout.isActive && (
                    <Button
                        onClick={handleQuickStart}
                        disabled={isLoading}
                        variant={isResumingSession ? "secondary" : "default"}
                        className={cn(
                            "h-9 px-4 gap-2 font-medium tracking-tight",
                            isResumingSession && "border-primary/20 text-primary"
                        )}
                    >
                        <Play data-icon="inline-start" className={cn(!isResumingSession && "fill-current")} />
                        {isResumingSession ? "Retomar" : "Iniciar"}
                    </Button>
                )}
            </CardFooter>
            <LoadingOverlay isLoading={isPending}/>
        </Card>
    );
};

export default WorkoutListItem;
