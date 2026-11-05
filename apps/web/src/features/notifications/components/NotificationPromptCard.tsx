import { motion } from "framer-motion";
import { Button } from "@/components/ui/button.tsx";
import { InlineErrorBanner } from "@/core/components/InlineErrorBanner.tsx";
import { useNotificationPrompt } from "../hooks/useNotificationPrompt.ts";
import { InstallInstructionsSheet } from "./InstallInstructionsSheet.tsx";

interface NotificationPromptCardProps {
    completedAt: string | Date | null | undefined;
}

export const NotificationPromptCard = ({ completedAt }: NotificationPromptCardProps) => {
    const {
        isVisible,
        needsInstall,
        isEnabling,
        hasError,
        isInstructionsOpen,
        setIsInstructionsOpen,
        handleAccept,
        handleDismiss,
    } = useNotificationPrompt(completedAt);

    if (!isVisible) return null;

    return (
        <>
            {/* Animação própria: as opções chegam depois do stagger da página. */}
            <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3"
            >
                <div>
                    <h2 className="text-[15px] font-medium">Quer um lembrete para treinar?</h2>
                    <p className="text-[13px] text-muted-foreground mt-1">
                        De segunda a sexta, no horário que você escolher.
                    </p>
                </div>

                {hasError && <InlineErrorBanner message="Não foi possível ativar. Tente novamente." />}

                <div className="flex gap-2">
                    <Button onClick={handleAccept} disabled={isEnabling} className="flex-1 h-11 font-medium">
                        {isEnabling ? "Ativando..." : needsInstall ? "Ver como ativar" : "Ativar"}
                    </Button>
                    <Button onClick={handleDismiss} variant="ghost" className="flex-1 h-11 font-medium text-muted-foreground">
                        Agora não
                    </Button>
                </div>
            </motion.section>

            <InstallInstructionsSheet open={isInstructionsOpen} onOpenChange={setIsInstructionsOpen} />
        </>
    );
};
