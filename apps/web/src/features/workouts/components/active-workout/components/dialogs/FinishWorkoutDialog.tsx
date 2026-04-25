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

interface FinishWorkoutDialogProps {
    isOpen: boolean;
    setOpen: (open: boolean) => void;
    onConfirm: () => void;
}

export const FinishWorkoutDialog = ({
    isOpen,
    setOpen,
    onConfirm
}: FinishWorkoutDialogProps) => {
    return (
        <AlertDialog open={isOpen} onOpenChange={setOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Finalizar mesmo assim?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Você ainda possui exercícios pendentes neste treino. Tem certeza que deseja finalizar a sessão agora?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Continuar Treinando</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={onConfirm}
                        className="bg-emerald-600 hover:bg-emerald-700"
                    >
                        Sim, Finalizar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
