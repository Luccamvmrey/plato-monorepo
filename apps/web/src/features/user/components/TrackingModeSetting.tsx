import { InlineErrorBanner } from "@/core/components/InlineErrorBanner";
import { cn } from "@/lib/utils";
import { useTrackingMode } from "../hooks/useTrackingMode";
import { TRACKING_MODES } from "../tracking-modes";

/** Primeira das configurações: é a única que muda como cada treino funciona. */
export const TrackingModeSetting = () => {
    const { trackingMode, setTrackingMode, hasActiveSession, hasError } = useTrackingMode();

    if (!trackingMode) return null;

    const current = TRACKING_MODES.find((mode) => mode.value === trackingMode);

    return (
        <div className="flex flex-col gap-2 px-4 py-3 border-b border-border">
            <p id="tracking-mode-label" className="text-[14px] font-medium">Modo de treino</p>

            <div role="radiogroup" aria-labelledby="tracking-mode-label" className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
                {TRACKING_MODES.map((mode) => (
                    <button
                        key={mode.value}
                        type="button"
                        role="radio"
                        aria-checked={trackingMode === mode.value}
                        onClick={() => setTrackingMode(mode.value)}
                        className={cn(
                            "h-10 rounded-md text-[14px] font-medium transition-colors",
                            trackingMode === mode.value ? "bg-card text-foreground" : "text-muted-foreground"
                        )}
                    >
                        {mode.label}
                    </button>
                ))}
            </div>

            <p className="text-[13px] text-muted-foreground">{current?.description}</p>

            {hasActiveSession && (
                <p className="text-[13px] text-muted-foreground">
                    Você tem um treino em andamento: a troca vale a partir do próximo.
                </p>
            )}

            {hasError && <InlineErrorBanner message="Não foi possível salvar. Tente novamente." />}
        </div>
    );
};
