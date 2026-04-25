import { Check } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import type { SessionSet } from "@/features/workouts/workout.types.ts";
import { getSetRowGridClass, COMMON_GRID_CLASSES } from "./SetRowLayout.ts";

type CompletedSetRowProps = {
    log: SessionSet;
    showEquipmentWeight: boolean;
};

export const CompletedSetRow = ({ log, showEquipmentWeight }: CompletedSetRowProps) => (
    <div className={cn(
        COMMON_GRID_CLASSES,
        "bg-muted/10 opacity-70",
        getSetRowGridClass(showEquipmentWeight)
    )}>
        <div className="flex items-center justify-center size-6 rounded-md bg-secondary text-secondary-foreground text-xs font-medium tabular-nums">
            {log.setNumber}
        </div>
        <div className="h-9 flex items-center justify-center tabular-nums text-sm font-medium">{log.actualWeight} kg</div>
        {showEquipmentWeight && (
            <div className="h-9 flex items-center justify-center tabular-nums text-sm font-medium text-amber-600">
                {log.equipmentWeight ? `+${log.equipmentWeight}kg` : "-"}
            </div>
        )}
        <div className="h-9 flex items-center justify-center tabular-nums text-sm font-medium">{log.actualReps}</div>
        <div className="h-9 flex items-center justify-center tabular-nums text-sm font-medium">{log.rpe}</div>
        <div className="size-9 flex items-center justify-center text-emerald-500">
            <Check className="size-5" />
        </div>
    </div>
);
