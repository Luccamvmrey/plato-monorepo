import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";

/** Moldura das páginas abertas por link (treino compartilhado, jam), com ou sem login. */
export const PublicShell = ({ children }: { children: ReactNode }) => (
    <main className="min-h-dvh w-screen bg-background overflow-y-auto px-4 pt-4">
        <div className="mx-auto max-w-lg flex flex-col gap-5">
            {/* Quem chega por um link pode nunca ter ouvido falar do app. */}
            <div className="flex items-center gap-2 text-[13px] text-muted-foreground min-h-6">
                <img src="/icon.svg" alt="" className="size-5 shrink-0" />
                <span className="font-semibold text-foreground">Plato</span>
                <span className="truncate">Registre treinos e acompanhe sua carga</span>
            </div>
            {children}
        </div>
    </main>
);

/** Estado de página inteira: link indisponível, erro de rede, jam encerrada. */
export const PublicMessage = ({ icon: Icon, title, description, action, onAction }: {
    icon: LucideIcon;
    title: string;
    description: string;
    action: string;
    onAction: () => void;
}) => (
    <PublicShell>
        <div className="flex flex-col items-center text-center gap-4 pt-24">
            <div className="size-12 rounded-2xl bg-muted flex items-center justify-center">
                <Icon className="size-5 text-muted-foreground" aria-hidden />
            </div>
            <div className="flex flex-col gap-1.5">
                <h1 className="text-[22px] font-semibold tracking-[-0.03em]">{title}</h1>
                <p className="text-[14px] text-muted-foreground">{description}</p>
            </div>
            <Button onClick={onAction} className="h-11 px-5 font-medium mt-2">{action}</Button>
        </div>
    </PublicShell>
);
