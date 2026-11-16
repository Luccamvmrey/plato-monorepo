import { ChevronLeft, Copy, Send } from "lucide-react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { InlineErrorBanner } from "@/core/components/InlineErrorBanner";
import { JamQrCode } from "@/features/jam/components/JamQrCode.tsx";
import { JamMemberList } from "@/features/jam/components/JamMemberList.tsx";
import { useJamQrPage } from "@/features/jam/hooks/useJamQrPage.ts";

const JamQrPage = () => {
    const { id = "" } = useParams<{ id: string }>();
    const {
        jam,
        url,
        isLoading,
        isUnavailable,
        currentUserId,
        memberLabel,
        canUseNativeShare,
        handleCopy,
        handleSend,
        handleStart,
    } = useJamQrPage(Number(id));

    return (
        <div className="flex flex-col gap-4 pb-[184px]">
            <div className="flex items-center gap-2 py-2">
                <button
                    type="button"
                    aria-label="Voltar ao treino"
                    onClick={handleStart}
                    className="w-8 h-8 -ml-1 rounded-lg flex items-center justify-center shrink-0
                               text-muted-foreground hover:text-foreground transition-colors relative tap-target"
                >
                    <ChevronLeft className="size-5" />
                </button>
                <h1 className="text-[24px] font-semibold tracking-[-0.03em] leading-tight">Jam</h1>
            </div>

            {isLoading && (
                <>
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="aspect-square w-full max-w-[280px] self-center rounded-xl" />
                </>
            )}

            {isUnavailable && <InlineErrorBanner message="Não foi possível abrir a jam." />}

            {jam && url && (
                <>
                    <header className="flex flex-col gap-1">
                        <p className="text-[13px] font-medium text-muted-foreground">Treino da jam</p>
                        <h2 className="text-[20px] font-semibold tracking-[-0.02em] leading-tight">{jam.workout.name}</h2>
                    </header>

                    <section aria-label="Convite" className="flex flex-col items-center gap-3 rounded-xl bg-card border border-border p-4">
                        <JamQrCode value={url} label={`QR para entrar na jam ${jam.workout.name}`} />
                        <p className="text-[14px] text-muted-foreground text-center">
                            Quem for treinar junto aponta a câmera do celular aqui.
                        </p>
                        <div className="flex gap-2 w-full">
                            <Button variant="outline" onClick={handleCopy} className="flex-1 h-11 gap-2 font-medium">
                                <Copy data-icon="inline-start" />
                                Copiar link
                            </Button>
                            {canUseNativeShare && (
                                <Button variant="outline" onClick={() => void handleSend()} className="flex-1 h-11 gap-2 font-medium">
                                    <Send data-icon="inline-start" />
                                    Enviar
                                </Button>
                            )}
                        </div>
                    </section>

                    <section aria-label="Quem está na jam" className="flex flex-col gap-1 rounded-xl bg-card border border-border px-4 py-3">
                        <h3 className="text-[13px] font-medium text-muted-foreground tabular-nums">{memberLabel}</h3>
                        <JamMemberList members={jam.members} hostUserId={jam.hostUserId} currentUserId={currentUserId} />
                    </section>
                </>
            )}

            <div className="fixed bottom-navbar inset-x-0 z-50 p-4 bg-background/95 backdrop-blur-sm border-t border-border">
                <Button
                    onClick={handleStart}
                    className="w-full h-12 rounded-lg font-medium text-[15px] tracking-[-0.01em]"
                >
                    Ir para o treino
                </Button>
            </div>
        </div>
    );
};

export default JamQrPage;
