import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingOverlayProps {
    isLoading: boolean;
    message?: string;
}

export const LoadingOverlay = ({ isLoading, message = "Carregando" }: LoadingOverlayProps) => {
    if (!isLoading) return null;

    return (
        <div
            className={cn(
                "fixed inset-0 z-[100] flex flex-col items-center justify-center",
                "bg-background/80 backdrop-blur-sm transition-all duration-300"
            )}
        >
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                {message && (
                    <p className="text-sm font-medium text-muted-foreground animate-pulse">
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
};