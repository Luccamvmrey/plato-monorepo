import type { Workout, WorkoutSession } from "@/features/workouts/workout.types.ts";
import { WorkoutTimer } from "./components/WorkoutTimer";

type ActiveWorkoutHeaderProps = {
    workout?: Workout;
    session?: WorkoutSession;
};

const ActiveWorkoutHeader = ({ workout, session }: ActiveWorkoutHeaderProps) => {
    if (!workout || !session) return null;

    return (
        <div className="bg-card flex flex-row items-center justify-between p-4 sticky top-0 z-10 rounded-xl border shadow-sm">
            <div className="flex flex-col">
                <span className="font-semibold text-lg leading-tight">{workout.name}</span>
                <WorkoutTimer startedAt={session.startedAt} />
            </div>
        </div>
    );
};

export default ActiveWorkoutHeader;
