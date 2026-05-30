import { useWorkoutTimer } from "@/features/workouts/hooks/useWorkoutTimer";
import { formatTime } from "@/core/utils/time";

interface WorkoutTimerProps {
    startedAt: string | Date | undefined;
}

export const WorkoutTimer = ({ startedAt }: WorkoutTimerProps) => {
    const { elapsedSeconds } = useWorkoutTimer(startedAt);

    return (
        <div className="bg-muted rounded-full px-4 py-1.5 text-sm font-mono text-foreground tabular-nums flex-shrink-0">
            {formatTime(elapsedSeconds)}
        </div>
    );
};
