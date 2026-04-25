import { Button } from "@/components/ui/button.tsx";

interface SummaryActionsProps {
    onFinish: () => void;
}

export const SummaryActions = ({ onFinish }: SummaryActionsProps) => {
    return (
        <Button 
            onClick={onFinish}
            className="w-full h-14 text-xl font-black sticky bottom-0 rounded-xl shadow-lg border-2 border-primary"
        >
            Concluir e Voltar
        </Button>
    );
};
