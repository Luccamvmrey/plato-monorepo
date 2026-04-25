import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Moon, Sun, Download, LogOut, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const GovernanceSettings = () => {
    const {
        theme,
        toggleTheme,
        handleExportData,
        handleDeleteAccount,
        handleLogout,
        isExporting,
        isDeleting
    } = useUserSettings();

    return (
        <Card className="border-destructive/20">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="w-5 h-5 text-muted-foreground" />
                    Configurações e Governança
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                {/* Theme Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold">Aparência</span>
                        <span className="text-xs text-muted-foreground">Alternar entre modo claro e escuro</span>
                    </div>
                    <Button variant="outline" size="icon" onClick={toggleTheme}>
                        {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </Button>
                </div>

                {/* Data Export */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold">Portabilidade de Dados</span>
                        <span className="text-xs text-muted-foreground">Exportar todo seu histórico em JSON</span>
                    </div>
                    <Button variant="outline" size="icon" onClick={handleExportData} disabled={isExporting}>
                        <Download className="w-4 h-4" />
                    </Button>
                </div>

                {/* Logout */}
                <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
                    <LogOut data-icon="inline-start" />
                    Encerrar Sessão
                </Button>

                {/* Delete Account */}
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full justify-start">
                            <Trash2 data-icon="inline-start" />
                            Excluir Conta Permanentemente
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta ação não pode ser desfeita. Isso excluirá permanentemente sua conta
                                e removerá todos os seus treinos, sessões e recordes de nossos servidores.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                                variant="destructive"
                                onClick={handleDeleteAccount} 
                                disabled={isDeleting}
                            >
                                {isDeleting ? "Excluindo..." : "Sim, excluir minha conta"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    );
};
