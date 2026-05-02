import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface InlineErrorBannerProps {
    message: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

export const InlineErrorBanner = ({ message, actionLabel, onAction, className }: InlineErrorBannerProps) => (
    <div className={cn(
        "flex items-start gap-3 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20",
        className
    )}>
        <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
        <p className="flex-1 text-[13px] text-destructive">{message}</p>
        {actionLabel && onAction && (
            <button
                onClick={onAction}
                className="text-[12px] font-medium text-destructive underline underline-offset-2 flex-shrink-0"
            >
                {actionLabel}
            </button>
        )}
    </div>
);
