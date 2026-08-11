import { useMemo } from "react";
import type { Workout } from "@/features/workouts/workout.types.ts";
import type { ProgramCycleEntry } from "@/features/workouts/program.types.ts";
import WorkoutListItem from "@/features/workouts/components/workout-list/WorkoutListItem.tsx";
import { Button } from "@/components/ui/button.tsx";
import { useLocation } from "wouter";
import { path } from "@/core/constants/path.ts";

type WorkoutListProps = {
    workouts?: Workout[];
    isArchivedView?: boolean;
    lastCompletedWorkoutId?: number;
    cycle?: ProgramCycleEntry[];
    programName?: string;
};

const SectionLabel = ({ children }: { children: string }) => (
    <h2 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground px-1">
        {children}
    </h2>
);

const WorkoutList = ({
    workouts,
    isArchivedView,
    lastCompletedWorkoutId,
    cycle,
    programName,
}: WorkoutListProps) => {
    const [, navigate] = useLocation();

    const handleCreateWorkout = () => {
        navigate(path.WORKOUT_EDITOR + "/new");
    }

    // O treino do programa é ordenado pela posição no ciclo, não pela ordem em que
    // foi criado — a rotação é a informação que importa aqui. Na visão de arquivados
    // não há agrupamento: um treino arquivado saiu da rotação por definição, mesmo
    // que ainda conste no programa.
    const { inProgram, standalone } = useMemo(() => {
        if (!workouts || !cycle?.length || isArchivedView) {
            return { inProgram: [] as Workout[], standalone: workouts ?? [] };
        }

        const byWorkoutId = new Map(cycle.map((entry) => [entry.workoutId, entry]));

        return {
            inProgram: workouts
                .filter((workout) => byWorkoutId.has(workout.id))
                .sort((a, b) => byWorkoutId.get(a.id)!.position - byWorkoutId.get(b.id)!.position),
            standalone: workouts.filter((workout) => !byWorkoutId.has(workout.id)),
        };
    }, [workouts, cycle, isArchivedView]);

    const cycleEntryFor = (workoutId: number) =>
        cycle?.find((entry) => entry.workoutId === workoutId);

    if (!workouts || workouts.length === 0) {
        return (
            <div className="bg-dot-grid flex-1 flex flex-col items-center justify-center p-8 text-center">
                {isArchivedView ? (
                    <p className="text-muted-foreground font-medium">Nenhum treino arquivado</p>
                ) : (
                    <Button
                        variant="outline"
                        className="flex flex-row gap-2 text-muted-foreground h-[56px] border-dashed border-2"
                        onClick={handleCreateWorkout}
                    >
                        Crie seu primeiro treino
                    </Button>
                )}
            </div>
        )
    }

    if (inProgram.length === 0) {
        return (
            <div className="flex flex-col gap-4">
                {standalone.map((workout) => (
                    <WorkoutListItem
                        workout={workout}
                        key={workout.id}
                        isLastDone={workout.id === lastCompletedWorkoutId}
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
                <SectionLabel>{programName ?? "Programa"}</SectionLabel>
                <div className="flex flex-col gap-4">
                    {inProgram.map((workout) => (
                        <WorkoutListItem
                            workout={workout}
                            key={workout.id}
                            isLastDone={workout.id === lastCompletedWorkoutId}
                            cycleEntry={cycleEntryFor(workout.id)}
                            cycleTotal={cycle?.length}
                        />
                    ))}
                </div>
            </div>

            {standalone.length > 0 && (
                <div className="flex flex-col gap-3">
                    <SectionLabel>Avulsos</SectionLabel>
                    <div className="flex flex-col gap-4">
                        {standalone.map((workout) => (
                            <WorkoutListItem
                                workout={workout}
                                key={workout.id}
                                isLastDone={workout.id === lastCompletedWorkoutId}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkoutList;
