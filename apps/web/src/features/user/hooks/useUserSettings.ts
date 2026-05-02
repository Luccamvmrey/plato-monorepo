import { useTheme } from "@/core/context/ThemeProvider";
import { useAuthStore } from "@/features/auth/auth.store";
import api from "@/core/api";
import { useState } from "react";
import { useSuccessState } from "@/core/hooks/useSuccessState";

export const useUserSettings = () => {
    const { theme, setTheme } = useTheme();
    const logout = useAuthStore(state => state.logout);
    const [isExporting, setIsExporting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const { isSuccess: exportSuccess, trigger: triggerExportSuccess } = useSuccessState();

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    const handleExportData = async () => {
        setIsExporting(true);
        setExportError(null);
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
            triggerExportSuccess();
        } catch (error) {
            console.error("Export failed:", error);
            setExportError("Falha ao exportar dados. Tente novamente.");
        } finally {
            setIsExporting(false);
        }
    };

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        setDeleteError(null);
        try {
            await api.delete("/users/account");
            logout();
        } catch (error) {
            console.error("Deletion failed:", error);
            setDeleteError("Falha ao excluir conta. Tente novamente.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleLogout = () => {
        logout();
    };

    return {
        theme,
        toggleTheme,
        handleExportData,
        handleDeleteAccount,
        handleLogout,
        isExporting,
        isDeleting,
        exportSuccess,
        exportError,
        deleteError,
    };
};
