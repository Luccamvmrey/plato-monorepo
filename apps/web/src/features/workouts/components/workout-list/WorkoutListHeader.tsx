import { Button } from "@/components/ui/button.tsx";
import { Plus } from "lucide-react";
import { useLocation } from "wouter";
import { path } from "@/core/constants/path.ts";

const WorkoutListHeader = () => {
    const [, navigate] = useLocation();

    const handleCreateWorkout = () => {
        navigate(path.WORKOUT_EDITOR + "/new");
    }

    return (
        <div className="flex flex-row items-center justify-between py-2">
            <h1 className="text-xl font-medium tracking-tight">Biblioteca</h1>
            <Button variant="ghost" size="icon" className="rounded-full relative tap-target" onClick={handleCreateWorkout} aria-label="Novo treino">
                <Plus className="w-5 h-5" />
            </Button>
        </div>
    );
};

export default WorkoutListHeader;