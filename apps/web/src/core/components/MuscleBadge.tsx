import { Badge, type BadgeProps } from "@/components/ui/badge";
import { muscleGroupTranslation } from "@/core/utils/translations";
import type { MuscleGroup } from "@plato/database/generated/prisma/enums";

interface MuscleBadgeProps extends BadgeProps {
    muscle: MuscleGroup;
}

/**
 * A standard badge for displaying translated muscle groups.
 */
export const MuscleBadge = ({ muscle, ...props }: MuscleBadgeProps) => {
    return (
        <Badge {...props}>
            {muscleGroupTranslation[muscle] || muscle}
        </Badge>
    );
};
