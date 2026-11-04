import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { UNITS } from "@/core/constants/units.ts";
import { formatWeightPtBr } from "@/features/workouts/utils/progression.ts";
import { WEIGHT_STEP } from "@/features/workouts/hooks/useExerciseWeightInput.ts";

type ExerciseWeightFieldProps = {
    id: string;
    value: string;
    onChange: (value: string) => void;
    onStep: (delta: number) => void;
    onRepeat: () => void;
    lastWeight?: number;
};

/**
 * Peso opcional, sem precisar abrir o teclado: repetir o da última vez e ajustar nos
 * botões resolve quase todo caso na academia. Digitar continua possível.
 */
const ExerciseWeightField = ({ id, value, onChange, onStep, onRepeat, lastWeight }: ExerciseWeightFieldProps) => (
    <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3 min-h-8">
            <label htmlFor={id} className="text-[13px] text-muted-foreground">
                Peso usado <span className="text-[12px]">· opcional</span>
            </label>
            {lastWeight !== undefined && !value && (
                <button
                    type="button"
                    onClick={onRepeat}
                    className="relative tap-target text-[13px] font-medium text-primary whitespace-nowrap"
                >
                    Repetir {formatWeightPtBr(lastWeight)} {UNITS.WEIGHT}
                </button>
            )}
        </div>

        <div className="flex items-center gap-2">
            <Button
                type="button"
                variant="secondary"
                className="size-12 shrink-0"
                aria-label={`Diminuir ${formatWeightPtBr(WEIGHT_STEP)} ${UNITS.WEIGHT}`}
                onClick={() => onStep(-WEIGHT_STEP)}
            >
                <Minus className="size-5" />
            </Button>

            {/* type="text" e não "number": o browser descarta a vírgula decimal do teclado
                pt-BR. A fonte fica em 16px ou mais para o iOS não dar zoom ao focar. */}
            <div className="relative flex-1 min-w-0">
                <Input
                    id={id}
                    type="text"
                    inputMode="decimal"
                    enterKeyHint="done"
                    placeholder="—"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                    }}
                    className="h-12 rounded-md text-center text-[20px] md:text-[20px] font-medium tabular-nums tracking-[-0.02em]"
                />
                {value && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground pointer-events-none">
                        {UNITS.WEIGHT}
                    </span>
                )}
            </div>

            <Button
                type="button"
                variant="secondary"
                className="size-12 shrink-0"
                aria-label={`Aumentar ${formatWeightPtBr(WEIGHT_STEP)} ${UNITS.WEIGHT}`}
                onClick={() => onStep(WEIGHT_STEP)}
            >
                <Plus className="size-5" />
            </Button>
        </div>
    </div>
);

export default ExerciseWeightField;
