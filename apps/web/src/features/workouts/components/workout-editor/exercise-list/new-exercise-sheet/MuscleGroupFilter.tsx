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
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
            <Badge
                variant={selectedMuscleGroup === "ALL" ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap p-3.5"
                onClick={() => onSelectMuscleGroup("ALL")}
            >
                Todos
            </Badge>

            {groups.map((group) => (
                <Badge
                    key={group}
                    variant={selectedMuscleGroup === group ? "default" : "outline"}
                    className={cn(
                        "cursor-pointer whitespace-nowrap transition-all p-3.5",
                        selectedMuscleGroup === group && "scale-105"
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