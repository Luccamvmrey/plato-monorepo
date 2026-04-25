import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import type { Workout } from "@/features/workouts/workout.types.ts";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Archive, PlayCircle, SquarePen, Undo2 } from "lucide-react";
import { LoadingOverlay } from "@/components/ui/loading-overlay.tsx";
import { MuscleBadge } from "@/core/components/MuscleBadge";
import { useWorkoutListItemLogic } from "@/features/workouts/hooks/useWorkoutListItemLogic.ts";

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
    } = useWorkoutListItemLogic(workout);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    {workout.name}
                </CardTitle>
                <CardDescription>{workout.description}</CardDescription>
                <CardAction className="flex flex-col items-end gap-1">
                    <Badge variant="outline">
                        {workout.workoutExercise.length ? `${workout.workoutExercise.length} exercício(s)` : "Sem exercícios"}
                    </Badge>
                    {!workout.isActive && <Badge variant="secondary">Arquivado</Badge>}
                    {isLastDone && (
                        <Badge variant="default">
                            Último Realizado
                        </Badge>
                    )}
                </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
                {workout.workoutExercise.map((wEx) => (
                    <div
                        className="flex flex-row items-center justify-between gap-1 font-light"
                        key={wEx.id}
                    >
                        <span className="flex-1">{wEx.exercise!.name}</span>
                        <MuscleBadge muscle={wEx.exercise!.targetMuscle} />
                        <Badge variant="outline">{wEx.targetSets}x{wEx.targetReps}</Badge>
                    </div>
                ))}
            </CardContent>
            <CardFooter className="w-full flex flex-row items-center justify-end gap-2">
                <Button variant="outline" size="icon" onClick={handleToggleStatus} title={workout.isActive ? "Arquivar" : "Reativar"}>
                    {workout.isActive ? <Archive className="w-4 h-4"/> : <Undo2 className="w-4 h-4"/>}
                </Button>

                <Button variant="outline" onClick={handleEdit}>
                    <SquarePen className="w-4 h-4"/>
                    Editar
                </Button>

                {workout.isActive && (
                    isResumingSession ? (
                        <Button onClick={handleQuickStart} variant="secondary" className="border-primary">
                            <PlayCircle className="text-primary w-4 h-4"/>
                            Retomar
                        </Button>
                    ) : (
                        <Button onClick={handleQuickStart} disabled={isLoading}>
                            <PlayCircle className="w-4 h-4"/>
                            Iniciar
                        </Button>
                    )
                )}
            </CardFooter>
            <LoadingOverlay isLoading={isPending}/>
        </Card>
    );
};

export default WorkoutListItem;