import type { JamState } from "@plato/shared";
import { Copy, Send } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { JamQrCode } from "@/features/jam/components/JamQrCode.tsx";
import { useJamInvite } from "@/features/jam/hooks/useJamInvite.ts";

/** QR com copiar e enviar. `compact` é a versão da sheet, que divide espaço com o resto. */
export const JamInvite = ({ jam, compact = false }: { jam: JamState; compact?: boolean }) => {
    const { url, canUseNativeShare, handleCopy, handleSend } = useJamInvite(jam);

    if (!url) return null;

    return (
        <div className="flex flex-col items-center gap-3">
            <JamQrCode
                value={url}
                label={`QR para entrar na jam ${jam.workout.name}`}
                className={compact ? "max-w-[200px]" : undefined}
            />
            <p className="text-[14px] text-muted-foreground text-center">
                Quem for treinar junto aponta a câmera do celular aqui.
            </p>
            <div className="flex gap-2 w-full">
                <Button variant="outline" onClick={handleCopy} className="flex-1 h-11 gap-2 font-medium">
                    <Copy data-icon="inline-start" />
                    Copiar link
                </Button>
                {canUseNativeShare && (
                    <Button variant="outline" onClick={handleSend} className="flex-1 h-11 gap-2 font-medium">
                        <Send data-icon="inline-start" />
                        Enviar
                    </Button>
                )}
            </div>
        </div>
    );
};
