import { Copy, Send } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { useShareLink } from "@/features/sharing/hooks/useShareLink.ts";
import type { CreateShareLinkPayload } from "@/features/sharing/sharing.types.ts";

type ShareSheetProps = CreateShareLinkPayload & {
    name: string;
    open: boolean;
    onClose: () => void;
};

/** Só cria o link depois de mostrar o que fica público: observação pode ser pessoal. */
const ShareSheet = ({ kind, sourceId, name, open, onClose }: ShareSheetProps) => {
    const { url, canUseNativeShare, isCreating, handleCreate, handleCopy, handleSend, reset } =
        useShareLink({ kind, sourceId }, name);

    const handleOpenChange = (next: boolean) => {
        if (next) return;

        reset();
        onClose();
    };

    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetContent
                side="bottom"
                onOpenAutoFocus={(event) => event.preventDefault()}
                className="rounded-t-2xl pb-[calc(env(safe-area-inset-bottom)+1rem)]"
            >
                <SheetHeader className="pb-0 pr-12">
                    <SheetTitle className="text-[20px] font-semibold tracking-[-0.02em]">
                        {url ? "Seu link está pronto" : `Compartilhar ${kind === "PROGRAM" ? "programa" : "treino"}`}
                    </SheetTitle>
                    <SheetDescription className="text-[14px] truncate">{name}</SheetDescription>
                </SheetHeader>

                {url ? (
                    <div className="flex flex-col gap-3 px-4">
                        <p className="text-[13px] text-muted-foreground break-all rounded-lg bg-muted px-3 py-2.5">{url}</p>
                        {canUseNativeShare && (
                            <Button onClick={handleSend} className="w-full h-[52px] gap-2 text-[15px] font-medium">
                                <Send data-icon="inline-start" />
                                Enviar link
                            </Button>
                        )}
                        <Button
                            onClick={handleCopy}
                            variant={canUseNativeShare ? "secondary" : "default"}
                            className="w-full h-12 gap-2 font-medium"
                        >
                            <Copy data-icon="inline-start" />
                            Copiar link
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 px-4">
                        <ul className="flex flex-col gap-2 text-[14px] text-muted-foreground leading-snug list-disc pl-5">
                            <li>Quem tiver o link vê o nome, a descrição, os exercícios e as <span className="text-foreground">suas observações</span>.</li>
                            <li>Seu nome e seu e-mail não aparecem.</li>
                            <li>O link é uma foto de agora: o que você mudar depois não entra nele.</li>
                            <li>Você pode desativar o link quando quiser em Perfil.</li>
                        </ul>
                        <Button
                            onClick={handleCreate}
                            disabled={isCreating}
                            className="w-full h-[52px] gap-2 text-[15px] font-medium"
                        >
                            {isCreating && <Spinner data-icon="inline-start" />}
                            Criar link
                        </Button>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
};

export default ShareSheet;
