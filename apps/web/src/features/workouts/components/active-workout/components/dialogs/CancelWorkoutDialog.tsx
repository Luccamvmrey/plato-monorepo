import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";

interface CancelWorkoutDialogProps {
    isOpen: boolean;
    setOpen: (open: boolean) => void;
    onConfirm: () => void;
}

export const CancelWorkoutDialog = ({
    isOpen,
    setOpen,
    onConfirm
}: CancelWorkoutDialogProps) => {
    return (
        <AlertDialog open={isOpen} onOpenChange={setOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Cancelar treino?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Isso irá excluir permanentemente todos os registros desta sessão. Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Voltar ao Treino</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={onConfirm}
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    >
                        Sim, Cancelar e Excluir
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
