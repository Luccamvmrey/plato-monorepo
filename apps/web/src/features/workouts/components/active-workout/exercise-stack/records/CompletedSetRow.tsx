import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import type { SessionSet } from "@/features/workouts/workout.types.ts";
import { cn } from "@/lib/utils.ts";
import { UNITS } from "@/core/constants/units.ts";

type CompletedSetRowProps = {
    log: SessionSet;
    showEquipmentWeight?: boolean;
    variant?: "active" | "summary";
};

export const CompletedSetRow = ({ 
    log, 
    showEquipmentWeight: _showEquipmentWeight,
    variant = "active"
}: CompletedSetRowProps) => {
    const isSummary = variant === "summary";

    return (
        <motion.div
            layout
            initial={!isSummary ? { opacity: 0, height: 0 } : undefined}
            animate={!isSummary ? { opacity: 0.7, height: 48 } : undefined}
            exit={!isSummary ? { opacity: 0, height: 0 } : undefined}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
                "flex items-center gap-3 rounded-xl bg-success-subtle overflow-hidden",
                isSummary ? "px-3 py-2 rounded-lg" : "px-4 h-12"
            )}
        >
            {!isSummary && <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />}
            <span className="text-[13px] font-medium text-success-subtle-fg">
                Set {log.setNumber} {!isSummary && "completo"}
            </span>
            <span className="ml-auto text-[12px] text-success-subtle-fg/70 tabular-nums whitespace-nowrap">
                {log.actualWeight}{UNITS.WEIGHT} · {log.actualReps}{UNITS.REPS} · RPE {log.rpe}
            </span>
        </motion.div>
    );
};
