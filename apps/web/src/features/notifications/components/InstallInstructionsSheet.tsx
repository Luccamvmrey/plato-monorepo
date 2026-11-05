import { Bell, Share, SquarePlus, Smartphone } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet.tsx";

const STEPS = [
    { icon: Share, text: "Toque em Compartilhar, na barra do navegador" },
    { icon: SquarePlus, text: "Escolha Adicionar à Tela de Início" },
    { icon: Smartphone, text: "Abra o Plato pelo novo ícone e entre na sua conta de novo" },
    { icon: Bell, text: "Em Perfil > Configurações > Notificações, toque em Ativar" },
];

export const InstallSteps = () => (
    <ol className="flex flex-col gap-3">
        {STEPS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-[14px] leading-snug">
                <span className="flex size-9 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-4 text-muted-foreground" aria-hidden />
                </span>
                {text}
            </li>
        ))}
    </ol>
);

interface InstallInstructionsSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const InstallInstructionsSheet = ({ open, onOpenChange }: InstallInstructionsSheetProps) => (
    <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
            side="bottom"
            onOpenAutoFocus={(event) => event.preventDefault()}
            className="rounded-t-2xl max-h-[85dvh] pb-[calc(env(safe-area-inset-bottom)+1rem)]"
        >
            <SheetHeader className="pb-0 pr-12">
                <SheetTitle className="text-[20px] font-semibold tracking-[-0.02em]">Instale o Plato no iPhone</SheetTitle>
                <SheetDescription className="text-[14px]">
                    O iPhone só entrega notificações de apps na tela de início. Não precisa de loja.
                </SheetDescription>
            </SheetHeader>
            <div className="px-4 pb-2">
                <InstallSteps />
            </div>
        </SheetContent>
    </Sheet>
);
