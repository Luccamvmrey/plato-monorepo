import { cn } from "@/lib/utils.ts";
import { getSetRowGridClass, COMMON_GRID_CLASSES } from "./SetRowLayout.ts";

type PendingSetRowProps = {
    setNum: number;
    reps: number;
    showEquipmentWeight: boolean;
};

export const PendingSetRow = ({ setNum, reps, showEquipmentWeight }: PendingSetRowProps) => (
    <div className={cn(
        COMMON_GRID_CLASSES,
        "last:border-b-0 opacity-40 grayscale pointer-events-none",
        getSetRowGridClass(showEquipmentWeight)
    )}>
        <div className="flex items-center justify-center size-6 rounded-md border border-dashed border-muted-foreground text-muted-foreground text-xs font-medium tabular-nums">
            {setNum}
        </div>
        <div className="h-9 flex items-center justify-center text-xs">-</div>
        {showEquipmentWeight && <div className="h-9 flex items-center justify-center text-xs">-</div>}
        <div className="h-9 flex items-center justify-center text-xs">{reps} reps</div>
        <div className="h-9 flex items-center justify-center text-xs">-</div>
        <div className="size-9" />
    </div>
);
