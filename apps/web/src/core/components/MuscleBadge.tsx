import { muscleGroupTranslation } from "@/core/utils/translations";
import type { MuscleGroup } from "@plato/database/generated/prisma/enums";
import { cn } from "@/lib/utils.ts";

interface MuscleBadgeProps {
    muscle: MuscleGroup;
    className?: string;
}

const muscleClassMap: Record<MuscleGroup, string> = {
    CHEST:       "badge-chest",
    SHOULDERS:   "badge-shoulders",
    TRICEPS:     "badge-triceps",
    BACK:        "badge-back",
    LOWER_BACK:  "badge-lower-back",
    TRAPS:       "badge-traps",
    BICEPS:      "badge-biceps",
    FOREARMS:    "badge-forearms",
    QUADRICEPS:  "badge-quadriceps",
    HAMSTRINGS:  "badge-hamstrings",
    GLUTES:      "badge-glutes",
    CALVES:      "badge-calves",
    CORE:        "badge-core",
    NECK:        "badge-neck",
}

/**
 * A standard badge for displaying translated muscle groups with Plato-specific styling.
 */
export const MuscleBadge = ({ muscle, className }: MuscleBadgeProps) => {
    return (
        <span className={cn("badge-muscle", muscleClassMap[muscle], className)}>
            {muscleGroupTranslation[muscle] || muscle}
        </span>
    );
};
