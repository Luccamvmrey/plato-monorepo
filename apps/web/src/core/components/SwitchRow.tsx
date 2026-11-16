import { cn } from "@/lib/utils.ts";

interface SwitchRowProps {
    label: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

/** Linha inteira clicável com um switch à direita. Alvo de toque de 44px no mínimo. */
export const SwitchRow = ({ label, description, checked, onChange }: SwitchRowProps) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="flex items-center gap-3 w-full min-h-11 py-1 text-left"
    >
        <span className="flex-1">
            <span className="block text-[14px] font-medium">{label}</span>
            <span className="block text-[13px] text-muted-foreground">{description}</span>
        </span>
        <span
            aria-hidden
            className={cn(
                "flex h-6 w-10 flex-shrink-0 items-center rounded-full p-0.5 transition-colors",
                checked ? "bg-primary" : "bg-muted"
            )}
        >
            <span
                className={cn(
                    "size-5 rounded-full bg-background transition-transform",
                    checked && "translate-x-4"
                )}
            />
        </span>
    </button>
);
