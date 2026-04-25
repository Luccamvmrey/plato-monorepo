import { Button } from "@/components/ui/button.tsx";
import { Library, Plus } from "lucide-react";
import { useLocation } from "wouter";
import { path } from "@/core/constants/path.ts";

const WorkoutListHeader = () => {
    const [_, navigate] = useLocation();

    const handleCreateWorkout = () => {
        navigate(path.WORKOUT_EDITOR + "/new");
    }

    return (
        <div className="bg-card flex flex-row items-center justify-between p-4 rounded-xl border">
            <div className="flex items-center gap-2">
                <Library className="w-5 h-5 text-primary" />
                <span className="font-semibold text-lg">Biblioteca</span>
            </div>
            <Button variant="outline" className="size-10" onClick={handleCreateWorkout}>
                <Plus/>
            </Button>
        </div>
    );
};

export default WorkoutListHeader;