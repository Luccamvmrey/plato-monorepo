import { path } from "@/core/constants/path.ts";
import { Button } from "@/components/ui/button.tsx";
import { LoadingOverlay } from "@/components/ui/loading-overlay.tsx";
import { useWorkoutSummaryLogic } from "@/features/workouts/hooks/useWorkoutSummaryLogic.ts";
import { SummaryHeader } from "@/features/workouts/components/workout-summary/components/SummaryHeader.tsx";
import { SummaryStats } from "@/features/workouts/components/workout-summary/components/SummaryStats.tsx";
import { SummaryActions } from "@/features/workouts/components/workout-summary/components/SummaryActions.tsx";

const WorkoutSummaryPage = () => {
    const {
        navigate,
        workoutSession,
        workout,
        stats,
        handleFinish,
        isLoading,
    } = useWorkoutSummaryLogic();

    if (isLoading) {
        return <LoadingOverlay isLoading={true} />;
    }

    if (!workoutSession || !workout || !stats) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center gap-4">
                <p className="text-muted-foreground">Dados do treino não encontrados.</p>
                <Button onClick={() => navigate(path.WORKOUTS)}>Voltar</Button>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col p-4 pb-20 overflow-y-auto">
            <div className="flex flex-col gap-6 mb-8">
                <SummaryHeader workoutName={workout.name} />
                <SummaryStats stats={stats} />
            </div>
            <div className="mt-auto">
                <SummaryActions onFinish={handleFinish} />
            </div>
        </div>
    );
};

export default WorkoutSummaryPage;
