import { Input } from "@/components/ui/input.tsx";
import { UNITS } from "@/core/constants/units.ts";
import { formatWeightPtBr } from "@/features/workouts/utils/progression.ts";

type ExerciseWeightFieldProps = {
    id: string;
    value: string;
    onChange: (value: string) => void;
    lastWeight?: number;
};

const ExerciseWeightField = ({ id, value, onChange, lastWeight }: ExerciseWeightFieldProps) => (
    <div className="flex items-center gap-3">
        <label htmlFor={id} className="flex-1 text-[13px] text-muted-foreground">
            Peso usado <span className="text-[12px]">(opcional)</span>
            {lastWeight !== undefined && (
                <span className="block text-[12px]">
                    Última vez: {formatWeightPtBr(lastWeight)} {UNITS.WEIGHT}
                </span>
            )}
        </label>
        {/* type="text" e não "number": o browser descarta a vírgula decimal do teclado
            pt-BR. Sem font-size menor que 16px, para o iOS não dar zoom ao focar. */}
        <div className="relative w-28 shrink-0">
            <Input
                id={id}
                type="text"
                inputMode="decimal"
                enterKeyHint="done"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                }}
                className="h-11 rounded-md pr-9 text-right tabular-nums"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground pointer-events-none">
                {UNITS.WEIGHT}
            </span>
        </div>
    </div>
);

export default ExerciseWeightField;
