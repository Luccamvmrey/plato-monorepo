import { MuscleBadge } from "@/core/components/MuscleBadge";
import { Button } from "@/components/ui/button.tsx";
import { cn } from "@/lib/utils.ts";

interface ActiveExerciseCardHeaderProps {
    name: string;
    targetMuscle: any; // Using any as per existing pattern for this component to avoid prisma enum import overhead in this layer
    isReadOnly: boolean;
    showEquipmentWeight: boolean;
    onToggleEquipmentWeight?: (e: React.MouseEvent) => void;
    onHeaderClick?: () => void;
}

export const ActiveExerciseCardHeader = ({
    name,
    targetMuscle,
    isReadOnly,
    showEquipmentWeight,
    onToggleEquipmentWeight,
    onHeaderClick
}: ActiveExerciseCardHeaderProps) => {
    return (
        <div 
            className={cn(
                "p-4 border-b bg-card flex justify-between items-start",
                onHeaderClick && "cursor-pointer hover:bg-muted/50 transition-colors"
            )}
            onClick={onHeaderClick}
        >
            <div className="flex flex-col gap-1.5">
                <span className={cn(
                    "font-semibold text-lg leading-tight",
                    isReadOnly ? "text-muted-foreground" : "text-primary"
                )}>
                    {name}
                </span>
                <MuscleBadge muscle={targetMuscle} variant="secondary" />
            </div>

            {!isReadOnly && onToggleEquipmentWeight && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggleEquipmentWeight}
                    className={cn(
                        "text-[10px] h-7 px-2 font-bold uppercase tracking-wider transition-colors",
                        showEquipmentWeight ? "text-amber-600 bg-amber-50" : "text-muted-foreground"
                    )}
                >
                    {showEquipmentWeight ? "Remover Barra" : "Adicionar Barra"}
                </Button>
            )}
        </div>
    );
};
