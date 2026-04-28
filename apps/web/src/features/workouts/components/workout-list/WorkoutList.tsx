import type { Workout } from "@/features/workouts/workout.types.ts";
import WorkoutListItem from "@/features/workouts/components/workout-list/WorkoutListItem.tsx";
import { Button } from "@/components/ui/button.tsx";
import { useLocation } from "wouter";
import { path } from "@/core/constants/path.ts";

type WorkoutListProps = {
    workouts?: Workout[];
    isArchivedView?: boolean;
    lastCompletedWorkoutId?: number;
};

const WorkoutList = ({ workouts, isArchivedView, lastCompletedWorkoutId }: WorkoutListProps) => {
    const [, navigate] = useLocation();

    const handleCreateWorkout = () => {
        navigate(path.WORKOUT_EDITOR + "/new");
    }

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

    return (
        <div className="flex flex-col gap-4">
            {workouts?.map((workout) => (
                <WorkoutListItem 
                    workout={workout} 
                    key={workout.id} 
                    isLastDone={workout.id === lastCompletedWorkoutId}
                />
            ))}
        </div>
    );
};

export default WorkoutList;