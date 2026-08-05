import { cn } from "@/lib/utils";

const RPE_VALUES = [6, 7, 8, 9, 10];

interface RpeSelectorProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

export const RpeSelector = ({ value, onChange, disabled }: RpeSelectorProps) => {
    return (
        <div className="flex gap-1.5">
            {RPE_VALUES.map((rpe) => (
                <button
                    key={rpe}
                    type="button"
                    disabled={disabled}
                    aria-pressed={value === rpe.toString()}
                    aria-label={`RPE ${rpe}`}
                    // Sem isto, tocar num chip tira o foco do campo numérico e o
                    // teclado fecha — é o que obrigava a reabri-lo a cada set.
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={() => onChange(rpe.toString())}
                    className={cn(
                        "flex-1 h-11 rounded-md text-[13px] transition-colors",
                        value === rpe.toString()
                            ? "bg-primary/15 text-primary border border-primary/30"
                            : "bg-muted text-muted-foreground"
                    )}
                >
                    {rpe}
                </button>
            ))}
        </div>
    );
};
