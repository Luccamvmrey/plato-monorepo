import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet.tsx";
import { TRACKING_MODES, type TrackingModeValue } from "@/features/user/tracking-modes.ts";

type TrackingModeChoiceSheetProps = {
    open: boolean;
    onCancel: () => void;
    onChoose: (mode: TrackingModeValue) => void;
};

/**
 * A pergunta do primeiro treino. Aparece uma vez, no momento em que a escolha passa a
 * importar: quem quer o modo simples não acharia a opção no fim do Perfil. Escolher já
 * inicia o treino, para a pergunta não custar um toque a mais.
 */
export const TrackingModeChoiceSheet = ({ open, onCancel, onChoose }: TrackingModeChoiceSheetProps) => (
    <Sheet open={open} onOpenChange={(next) => !next && onCancel()}>
        {/* Sem foco automático: o contorno na primeira opção parecia uma resposta já
            escolhida, e esta pergunta precisa ser neutra. */}
        <SheetContent
            side="bottom"
            onOpenAutoFocus={(event) => event.preventDefault()}
            className="rounded-t-2xl pb-[calc(env(safe-area-inset-bottom)+1rem)]"
        >
            <SheetHeader className="pb-0 pr-12">
                <SheetTitle className="text-[20px] font-semibold tracking-[-0.02em]">
                    Como quer registrar seus treinos?
                </SheetTitle>
                <SheetDescription className="text-[14px]">
                    Dá para trocar quando quiser no Perfil.
                </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-2 px-4">
                {TRACKING_MODES.map((mode) => (
                    <button
                        key={mode.value}
                        type="button"
                        onClick={() => onChoose(mode.value)}
                        className="flex flex-col gap-1 p-4 rounded-xl bg-card border border-border text-left transition-transform active:scale-[0.98]"
                    >
                        <span className="text-[17px] font-semibold tracking-[-0.02em]">{mode.label}</span>
                        <span className="text-[14px] text-muted-foreground leading-snug">{mode.description}</span>
                    </button>
                ))}
            </div>
        </SheetContent>
    </Sheet>
);
