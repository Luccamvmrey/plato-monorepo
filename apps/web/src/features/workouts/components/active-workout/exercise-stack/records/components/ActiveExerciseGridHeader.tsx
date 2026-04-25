import { cn } from "@/lib/utils.ts";
import { getSetRowGridClass } from "../SetRowLayout.ts";

interface ActiveExerciseGridHeaderProps {
    showEquipmentWeight: boolean;
}

export const ActiveExerciseGridHeader = ({ showEquipmentWeight }: ActiveExerciseGridHeaderProps) => {
    return (
        <div className={cn(
            "grid items-center gap-3 px-2 py-2 bg-secondary/50 border-b text-[10px] uppercase tracking-wider font-bold text-muted-foreground text-center",
            getSetRowGridClass(showEquipmentWeight)
        )}>
            <span className="w-6">Set</span>
            <span>Carga</span>
            {showEquipmentWeight && <span>Barra</span>}
            <span>Reps</span>
            <span>RPE</span>
            <span className="w-9">Status</span>
        </div>
    );
};
