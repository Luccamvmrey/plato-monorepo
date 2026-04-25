import { Timer } from "lucide-react";
import { useWorkoutTimer } from "@/features/workouts/hooks/useWorkoutTimer";
import { formatTime } from "@/core/utils/time";

interface WorkoutTimerProps {
    startedAt: string | Date | undefined;
}

export const WorkoutTimer = ({ startedAt }: WorkoutTimerProps) => {
    const { elapsedSeconds } = useWorkoutTimer(startedAt);

    return (
        <div className="flex items-center gap-1.5 font-medium text-muted-foreground text-xs tabular-nums mt-0.5">
            <Timer className="size-3.5" />
            <span>{formatTime(elapsedSeconds)}</span>
        </div>
    );
};
