import { useState } from "react";
import { ChevronRight, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet.tsx";
import DeletionAlertDialog from "@/core/components/DeletionAlertDialog.tsx";
import { useOwnLinks } from "@/features/sharing/hooks/useOwnLinks.ts";

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

export const SharedLinksSetting = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { links, isLoading, isRevoking, handleCopy, handleRevoke } = useOwnLinks();

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-3 w-full px-4 py-3 border-b border-border hover:bg-muted/40 transition-colors text-left"
            >
                <div className="flex-1">
                    <p className="text-[13px] font-medium text-foreground">Links compartilhados</p>
                    <p className="text-[12px] text-muted-foreground">
                        {links.length > 0 ? plural(links.length, "link ativo", "links ativos") : "Nenhum link ativo"}
                    </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden />
            </button>

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetContent
                    side="bottom"
                    onOpenAutoFocus={(event) => event.preventDefault()}
                    className="rounded-t-2xl max-h-[85dvh] pb-[calc(env(safe-area-inset-bottom)+1rem)]"
                >
                    <SheetHeader className="pb-0 pr-12">
                        <SheetTitle className="text-[20px] font-semibold tracking-[-0.02em]">Links compartilhados</SheetTitle>
                        <SheetDescription className="text-[14px]">
                            Quem já adicionou mantém a própria cópia depois que você desativa o link.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex flex-col px-4 overflow-y-auto">
                        {!isLoading && links.length === 0 && (
                            <p className="text-[14px] text-muted-foreground py-6 text-center">
                                Compartilhe um treino ou programa para ver o link aqui.
                            </p>
                        )}

                        {links.map((link) => (
                            <div key={link.id} className="flex items-center gap-2 py-3 border-t border-border">
                                <div className="flex-1 min-w-0">
                                    <p className="text-[14px] font-medium truncate">{link.name}</p>
                                    <p className="text-[13px] text-muted-foreground tabular-nums">
                                        {plural(link.viewCount, "visita", "visitas")} · {plural(link.addCount, "adição", "adições")}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-9 text-muted-foreground relative tap-target"
                                    onClick={() => handleCopy(link.token)}
                                    aria-label={`Copiar link de ${link.name}`}
                                >
                                    <Copy data-icon="inline" />
                                </Button>
                                <DeletionAlertDialog
                                    title="Desativar este link?"
                                    description="Quem abrir o link não verá mais o conteúdo. Quem já adicionou mantém a própria cópia."
                                    confirmLabel="Desativar"
                                    onConfirm={() => handleRevoke(link.id)}
                                >
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        disabled={isRevoking}
                                        className="size-9 text-muted-foreground relative tap-target"
                                        aria-label={`Desativar link de ${link.name}`}
                                    >
                                        <Trash2 data-icon="inline" />
                                    </Button>
                                </DeletionAlertDialog>
                            </div>
                        ))}
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
};
