import { Badge } from "@/components/ui/badge";
import { MuscleGroup } from "@plato/database/generated/prisma/enums.ts";
import { muscleGroupTranslation } from "@/core/utils/translations.ts";
import { cn } from "@/lib/utils.ts";

type MuscleGroupFilterProps = {
    selectedMuscleGroup: string;
    onSelectMuscleGroup: (muscleGroup: string) => void;
};

const MuscleGroupFilter = ({ selectedMuscleGroup, onSelectMuscleGroup }: MuscleGroupFilterProps) => {
    const groups = Object.values(MuscleGroup);

    return (
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            <Badge
                variant={selectedMuscleGroup === "ALL" ? "default" : "secondary"}
                className={cn(
                    "cursor-pointer whitespace-nowrap px-4 py-2 rounded-full font-medium transition-colors border border-transparent shadow-none",
                    selectedMuscleGroup !== "ALL" && "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
                onClick={() => onSelectMuscleGroup("ALL")}
            >
                Todos
            </Badge>

            {groups.map((group) => (
                <Badge
                    key={group}
                    variant={selectedMuscleGroup === group ? "default" : "secondary"}
                    className={cn(
                        "cursor-pointer whitespace-nowrap px-4 py-2 rounded-full font-medium transition-colors border border-transparent shadow-none",
                        selectedMuscleGroup !== group && "bg-muted/50 text-muted-foreground hover:bg-muted"
                    )}
                    onClick={() => onSelectMuscleGroup(group)}
                >
                    {muscleGroupTranslation[group] || group}
                </Badge>
            ))}
        </div>
    );
};

export default MuscleGroupFilter;