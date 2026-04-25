import { useTheme } from "@/core/context/ThemeProvider";
import { useAuthStore } from "@/features/auth/auth.store";
import api from "@/core/api";
import { toast } from "sonner";
import { useState } from "react";

export const useUserSettings = () => {
    const { theme, setTheme } = useTheme();
    const logout = useAuthStore(state => state.logout);
    const [isExporting, setIsExporting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    const handleExportData = async () => {
        setIsExporting(true);
        try {
            const response = await api.get("/users/export");
            const data = response.data;
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `plato-data-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast.success("Dados exportados com sucesso!");
        } catch (error) {
            console.error("Export failed:", error);
            toast.error("Falha ao exportar dados.");
        } finally {
            setIsExporting(false);
        }
    };

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            await api.delete("/users/account");
            toast.success("Conta excluída permanentemente.");
            logout();
        } catch (error) {
            console.error("Deletion failed:", error);
            toast.error("Falha ao excluir conta.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleLogout = () => {
        logout();
        toast.success("Sessão encerrada.");
    };

    return {
        theme,
        toggleTheme,
        handleExportData,
        handleDeleteAccount,
        handleLogout,
        isExporting,
        isDeleting
    };
};
