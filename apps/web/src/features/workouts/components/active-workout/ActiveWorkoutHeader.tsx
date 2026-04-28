import type { Workout, WorkoutSession } from "@/features/workouts/workout.types.ts";
import { WorkoutTimer } from "./components/WorkoutTimer";
import { ChevronLeft } from "lucide-react";

type ActiveWorkoutHeaderProps = {
    workout?: Workout;
    session?: WorkoutSession;
    onBackClick?: () => void;
};

const ActiveWorkoutHeader = ({ workout, session, onBackClick }: ActiveWorkoutHeaderProps) => {
    if (!workout || !session) return null;

    return (
        <div className="h-12 flex items-center justify-between sticky top-0 z-10">
            <button
                onClick={onBackClick}
                className="flex items-center gap-1.5 min-w-0"
            >
                <ChevronLeft className="size-5 text-muted-foreground flex-shrink-0" />
                <span className="text-base font-medium tracking-[-0.02em] text-foreground truncate">
                    {workout.name}
                </span>
            </button>
            <WorkoutTimer startedAt={session.startedAt} />
        </div>
    );
};

export default ActiveWorkoutHeader;