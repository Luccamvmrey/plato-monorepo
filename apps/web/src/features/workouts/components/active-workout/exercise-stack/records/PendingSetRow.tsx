import { UNITS } from "@/core/constants/units.ts";
import { formatWeightPtBr } from "@/features/workouts/utils/progression.ts";

type PendingSetRowProps = {
    setNum: number;
    reps: number;
    weight?: number;
    showEquipmentWeight?: boolean;
};

export const PendingSetRow = ({ setNum, reps, weight, showEquipmentWeight: _showEquipmentWeight }: PendingSetRowProps) => (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/30 opacity-40">
        <span className="w-6 h-6 rounded-md bg-muted flex items-center justify-center text-[11px] font-medium text-muted-foreground flex-shrink-0">
            {setNum}
        </span>
        <span className="text-[12px] text-muted-foreground">
            {/* != null e não truthiness: 0 kg (peso corporal, máquina assistida) é
                carga legítima e virava travessão. */}
            {weight != null ? `${formatWeightPtBr(weight)} ${UNITS.WEIGHT}` : '—'} · {reps} reps
        </span>
    </div>
);
