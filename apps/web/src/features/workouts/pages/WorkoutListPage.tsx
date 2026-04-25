import { useWorkouts } from "@/features/workouts/hooks/useWorkouts.ts";
import { LoadingOverlay } from "@/components/ui/loading-overlay.tsx";
import WorkoutListHeader from "@/features/workouts/components/workout-list/WorkoutListHeader.tsx";
import WorkoutList from "@/features/workouts/components/workout-list/WorkoutList.tsx";
import { useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Archive, LayoutList } from "lucide-react";

const WorkoutListPage = () => {
    const [showArchived, setShowArchived] = useState(false);
    const { userWorkoutsQuery, lastCompletedSessionQuery } = useWorkouts(undefined, !showArchived);

    const { data: workouts, isLoading } = userWorkoutsQuery;
    const lastCompletedWorkoutId = lastCompletedSessionQuery.data?.workoutId;

    return (
        <div className="h-full flex flex-col gap-3 mb-[100px]">
            <WorkoutListHeader/>

            <div className="flex justify-end px-4">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowArchived(!showArchived)}
                    className="text-muted-foreground gap-2"
                >
                    {showArchived ? (
                        <>
                            <LayoutList className="w-4 h-4"/>
                            Ver Ativos
                        </>
                    ) : (
                        <>
                            <Archive className="w-4 h-4"/>
                            Ver Arquivados
                        </>
                    )}
                </Button>
            </div>

            <WorkoutList 
                workouts={workouts} 
                isArchivedView={showArchived} 
                lastCompletedWorkoutId={lastCompletedWorkoutId}
            />

            <LoadingOverlay isLoading={isLoading}/>
        </div>
    );
};

export default WorkoutListPage;