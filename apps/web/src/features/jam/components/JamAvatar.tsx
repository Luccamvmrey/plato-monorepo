import { cn } from "@/lib/utils.ts";

/** Inicial do nome. O anel marca quem está no mesmo exercício que você. */
export const JamAvatar = ({ name, isHighlighted = false, className }: {
    name: string;
    isHighlighted?: boolean;
    className?: string;
}) => (
    <span
        aria-hidden
        className={cn(
            "shrink-0 rounded-full bg-muted flex items-center justify-center font-medium",
            isHighlighted && "ring-2 ring-primary ring-offset-2 ring-offset-card",
            className ?? "size-9 text-[14px]"
        )}
    >
        {name.charAt(0).toUpperCase()}
    </span>
);
