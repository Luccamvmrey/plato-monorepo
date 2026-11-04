import { useMemo } from "react";
import type { ReactNode } from "react";
import type { Workout } from "@/features/workouts/workout.types.ts";
import type { ProgramCycleEntry } from "@/features/workouts/program.types.ts";
import WorkoutListItem from "@/features/workouts/components/workout-list/WorkoutListItem.tsx";
import { Button } from "@/components/ui/button.tsx";
import { useLocation } from "wouter";
import { path } from "@/core/constants/path.ts";
import { useFeaturedPlans } from "@/features/sharing/hooks/useFeaturedPlans.ts";

type WorkoutListProps = {
    workouts?: Workout[];
    isArchivedView?: boolean;
    lastCompletedWorkoutId?: number;
    cycle?: ProgramCycleEntry[];
    programName?: string;
};

const Section = ({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) => (
    <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3 px-1 min-h-6">
            <h2 className="text-[13px] font-medium text-muted-foreground truncate">{title}</h2>
            {action}
        </div>
        {children}
    </section>
);

const WorkoutList = ({
    workouts,
    isArchivedView,
    lastCompletedWorkoutId,
    cycle,
    programName,
}: WorkoutListProps) => {
    const [, navigate] = useLocation();
    const { hasPlans: hasSuggestedPrograms } = useFeaturedPlans();

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
                    <div className="flex flex-col items-center gap-2">
                        {hasSuggestedPrograms && (
                            <Button className="h-[52px] px-5 font-medium" onClick={() => navigate(path.SUGGESTED)}>
                                Começar com um programa pronto
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            className="flex flex-row gap-2 text-muted-foreground h-[56px] border-dashed border-2"
                            onClick={handleCreateWorkout}
                        >
                            Crie seu primeiro treino
                        </Button>
                    </div>
                )}
            </div>
        )
    }

    const standaloneItems = standalone.map((workout) => (
        <WorkoutListItem
            workout={workout}
            key={workout.id}
            isLastDone={workout.id === lastCompletedWorkoutId}
        />
    ));

    if (inProgram.length === 0) {
        return <div className="flex flex-col gap-2">{standaloneItems}</div>;
    }

    const featured = inProgram.find((workout) => cycleEntryFor(workout.id)?.isNext);
    const restOfCycle = inProgram.filter((workout) => workout !== featured);

    return (
        <div className="flex flex-col gap-5">
            {featured && (
                <WorkoutListItem
                    workout={featured}
                    isLastDone={featured.id === lastCompletedWorkoutId}
                    cycleEntry={cycleEntryFor(featured.id)}
                    cycleTotal={cycle?.length}
                    programName={programName}
                    isFeatured
                />
            )}

            {restOfCycle.length > 0 && (
                <Section
                    title={featured ? "Resto da rotação" : programName ?? "Programa"}
                    action={
                        <button
                            type="button"
                            onClick={() => navigate(path.PROGRAMS)}
                            className="relative tap-target text-[13px] font-medium text-primary shrink-0"
                        >
                            Programas
                        </button>
                    }
                >
                    {restOfCycle.map((workout) => (
                        <WorkoutListItem
                            workout={workout}
                            key={workout.id}
                            isLastDone={workout.id === lastCompletedWorkoutId}
                            cycleEntry={cycleEntryFor(workout.id)}
                            cycleTotal={cycle?.length}
                        />
                    ))}
                </Section>
            )}

            {standalone.length > 0 && <Section title="Fora da rotação">{standaloneItems}</Section>}
        </div>
    );
};

export default WorkoutList;
