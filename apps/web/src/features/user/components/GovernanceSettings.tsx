import { useState } from "react";
import { Settings, Sun, Moon, Download, LogOut, Trash2 } from "lucide-react";
import { useUserSettings } from "../hooks/useUserSettings";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

export const GovernanceSettings = () => {
    const { theme, toggleTheme, handleExportData, handleDeleteAccount, handleLogout, isExporting, isDeleting } =
        useUserSettings();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [confirmText, setConfirmText] = useState("");

    const onDeleteConfirm = async () => {
        await handleDeleteAccount();
        setDeleteDialogOpen(false);
        setConfirmText("");
    };

    return (
        <>
            <div className="mx-4 mb-4 bg-card border border-border rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                    <Settings className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <p className="text-[13px] font-medium text-foreground">Configurações</p>
                </div>

                {/* Aparência */}
                <button
                    onClick={toggleTheme}
                    className="flex items-center gap-3 w-full px-4 py-3 border-b border-border
                               hover:bg-muted/40 transition-colors text-left"
                >
                    <div className="flex-1">
                        <p className="text-[13px] font-medium text-foreground">Aparência</p>
                        <p className="text-[12px] text-muted-foreground">
                            Alternar entre modo claro e escuro
                        </p>
                    </div>
                    {theme === "dark" ? (
                        <Sun className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    ) : (
                        <Moon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    )}
                </button>

                {/* Portabilidade de dados */}
                <button
                    onClick={handleExportData}
                    disabled={isExporting}
                    className="flex items-center gap-3 w-full px-4 py-3 border-b border-border
                               hover:bg-muted/40 transition-colors text-left disabled:opacity-50"
                >
                    <div className="flex-1">
                        <p className="text-[13px] font-medium text-foreground">Portabilidade de dados</p>
                        <p className="text-[12px] text-muted-foreground">
                            Exportar todo seu histórico em JSON
                        </p>
                    </div>
                    <Download className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </button>

                {/* Encerrar sessão */}
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 border-b border-border
                               hover:bg-muted/40 transition-colors text-left"
                >
                    <LogOut className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <p className="text-[13px] font-medium text-foreground">Encerrar sessão</p>
                </button>

                {/* Excluir conta */}
                <button
                    onClick={() => setDeleteDialogOpen(true)}
                    className="flex items-center gap-3 w-full px-4 py-3
                               hover:bg-destructive/5 transition-colors text-left"
                >
                    <Trash2 className="w-4 h-4 text-destructive flex-shrink-0" />
                    <p className="text-[13px] font-medium text-destructive">
                        Excluir conta permanentemente
                    </p>
                </button>
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
                setDeleteDialogOpen(open);
                if (!open) setConfirmText("");
            }}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-[17px] font-medium tracking-[-0.02em]">
                            Excluir conta permanentemente?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-[13px] text-muted-foreground">
                            Todos os seus treinos, histórico e recordes serão apagados e não poderão
                            ser recuperados. Para confirmar, digite <strong>EXCLUIR</strong> abaixo.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <Input
                        value={confirmText}
                        onChange={e => setConfirmText(e.target.value)}
                        placeholder="EXCLUIR"
                        className="h-11 rounded-md font-mono text-[13px]"
                    />

                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-lg">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={confirmText !== "EXCLUIR" || isDeleting}
                            onClick={onDeleteConfirm}
                            className="rounded-lg bg-destructive text-destructive-foreground
                                       disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {isDeleting ? "Excluindo..." : "Excluir conta"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
