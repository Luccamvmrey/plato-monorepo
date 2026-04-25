import { Loader2, Check } from "lucide-react";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { cn } from "@/lib/utils.ts";
import { getSetRowGridClass } from "./SetRowLayout.ts";
import { useActiveSetInput, type SetSubmissionData } from "@/features/workouts/hooks/useActiveSetInput.ts";

export type { SetSubmissionData };

type ActiveSetInputRowProps = {
    setNumber: number;
    targetReps: number;
    previousWeight?: number;
    showEquipmentWeight?: boolean;
    previousEquipmentWeight?: number;
    onConfirm: (data: SetSubmissionData) => void;
    isPending?: boolean;
};

export const ActiveSetInputRow = ({
                                      setNumber,
                                      targetReps,
                                      previousWeight,
                                      showEquipmentWeight = false,
                                      previousEquipmentWeight,
                                      onConfirm,
                                      isPending = false
                                  }: ActiveSetInputRowProps) => {
    
    const { state, actions } = useActiveSetInput({
        setNumber,
        targetReps,
        previousWeight,
        previousEquipmentWeight,
        onConfirm,
        isPending
    });

    const { weight, reps, rpe, equipmentWeight, wasSubmitted } = state;
    const { setWeight, setReps, setRpe, setEquipmentWeight, handleConfirm } = actions;

    return (
        <div className={cn(
            "grid items-center gap-3 p-2 bg-background border-b last:border-b-0",
            getSetRowGridClass(showEquipmentWeight)
        )}>
            <div className="flex items-center justify-center size-6 rounded-md bg-secondary text-secondary-foreground text-xs font-medium tabular-nums">
                {setNumber}
            </div>

            <Input
                type="number"
                inputMode="decimal"
                placeholder={previousWeight ? `${previousWeight}kg` : "kg"}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                disabled={isPending || wasSubmitted}
                className="h-9 tabular-nums text-center px-1"
            />

            {showEquipmentWeight && (
                <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="Barra"
                    value={equipmentWeight}
                    onChange={(e) => setEquipmentWeight(e.target.value)}
                    disabled={isPending || wasSubmitted}
                    className="h-9 tabular-nums text-center px-1 bg-amber-50/30 border-amber-200"
                />
            )}

            <Input
                type="number"
                inputMode="numeric"
                placeholder="reps"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                disabled={isPending || wasSubmitted}
                className="h-9 tabular-nums text-center px-1"
            />

            <Input
                type="number"
                inputMode="numeric"
                placeholder="RPE"
                value={rpe}
                onChange={(e) => setRpe(e.target.value)}
                disabled={isPending || wasSubmitted}
                min={1}
                max={10}
                className="h-9 tabular-nums text-center px-1"
            />

            <Button
                size="icon-sm"
                variant="default"
                onClick={handleConfirm}
                disabled={isPending || wasSubmitted || !weight || !reps || !rpe}
                className={cn(
                    "size-9 transition-colors",
                    "bg-emerald-600 hover:bg-emerald-700 text-white"
                )}
            >
                {isPending || wasSubmitted ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            </Button>
        </div>
    );
};
