import { ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { path } from "@/core/constants/path.ts";
import { useNotificationSettings } from "@/features/notifications/hooks/useNotificationSettings.ts";

/** Só mostra o caminho; quem barra de verdade é o `requireAdmin` da rota. */
export const AdminDashboardLink = () => {
    const [, navigate] = useLocation();
    const { settings } = useNotificationSettings();

    if (!settings?.canDebug) return null;

    return (
        <button
            type="button"
            onClick={() => navigate(path.ADMIN)}
            className="flex items-center gap-3 w-full px-4 py-3 border-b border-border hover:bg-muted/40 transition-colors text-left"
        >
            <div className="flex-1">
                <p className="text-[13px] font-medium text-foreground">Painel de uso</p>
                <p className="text-[12px] text-muted-foreground">Quem está treinando e o que cada um usa</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden />
        </button>
    );
};
