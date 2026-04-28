import {
    Select,
    SelectContent,
    SelectItem,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Archive } from "lucide-react";
import type { Workout } from "@/features/workouts/workout.types";

interface WorkoutFilterSelectProps {
    value: string;
    onValueChange: (value: string) => void;
    workouts: Workout[] | undefined;
}

export const WorkoutFilterSelect = ({ value, onValueChange, workouts }: WorkoutFilterSelectProps) => {
    const activeWorkouts = workouts?.filter(w => w.isActive) || [];
    const inactiveWorkouts = workouts?.filter(w => !w.isActive) || [];

    return (
        <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger className="w-[130px] h-9 rounded-lg text-[13px]">
                <SelectValue placeholder="Filtrar por treino" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                
                {activeWorkouts.length > 0 && <SelectSeparator />}
                {activeWorkouts.map(workout => (
                    <SelectItem key={workout.id} value={workout.id.toString()}>
                        {workout.name}
                    </SelectItem>
                ))}

                {inactiveWorkouts.length > 0 && (
                    <>
                        <SelectSeparator />
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                            Arquivados
                        </div>
                        {inactiveWorkouts.map(workout => (
                            <SelectItem 
                                key={workout.id} 
                                value={workout.id.toString()}
                                className="text-muted-foreground"
                            >
                                <div className="flex items-center gap-2">
                                    <Archive className="w-3 h-3" />
                                    {workout.name}
                                </div>
                            </SelectItem>
                        ))}
                    </>
                )}
            </SelectContent>
        </Select>
    );
};
