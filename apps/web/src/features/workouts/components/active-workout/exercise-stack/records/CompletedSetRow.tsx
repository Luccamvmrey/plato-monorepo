import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import type { SessionSet } from "@/features/workouts/workout.types.ts";

type CompletedSetRowProps = {
    log: SessionSet;
};

export const CompletedSetRow = ({ log }: CompletedSetRowProps) => (
    <motion.div
        layout
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 0.7, height: 48 }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center gap-3 px-4 rounded-xl bg-success-subtle overflow-hidden"
    >
        <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
        <span className="text-[13px] font-medium text-success-subtle-fg">
            Set {log.setNumber} completo
        </span>
        <span className="ml-auto text-[12px] text-success-subtle-fg/70 tabular-nums whitespace-nowrap">
            {log.actualWeight}kg · {log.actualReps}rep · RPE {log.rpe}
        </span>
    </motion.div>
);
