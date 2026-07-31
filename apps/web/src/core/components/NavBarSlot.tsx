import { type LucideIcon } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { cn } from "@/lib/utils.ts";
import type { PropsWithChildren } from "react";

type NavBarSlotProps = {
    link: string;
    slotIcon: LucideIcon;
    label: string;
    showBadge?: boolean;
};

export const NavBarSlot = ({ link, slotIcon, label, showBadge }: NavBarSlotProps) => {
    const [, navigate] = useLocation();
    const Icon = slotIcon;
    const [isActive] = useRoute(`${link}/:id?`)

    const handleClick = () => {
        navigate(link);
    }

    return (
        // Era um <div onClick>: sem role, sem tabIndex, invisível para leitor de tela
        // e inalcançável por teclado — a navegação principal do app inteiro.
        // 64px já passa da diretriz de 44px, então só a semântica mudou.
        <button
            type="button"
            aria-current={isActive ? "page" : undefined}
            className="flex flex-col items-center justify-center gap-2 size-[64px] rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            onClick={handleClick}
        >
            <div className="relative size-8 flex items-center justify-center">
                <Icon className={isActive ? "text-primary" : "text-muted-foreground"}/>

                {showBadge && (
                    <>
                        <span
                            aria-hidden="true"
                            className="absolute top-0 right-0 size-2.5 bg-primary rounded-full border-2 border-background animate-pulse"/>
                        {/* O ponto pulsante é puramente visual; sem isto o leitor de
                            tela anuncia "Sessão" igual a qualquer outra aba. */}
                        <span className="sr-only">— sessão em andamento</span>
                    </>
                )}
            </div>
            <span className={cn(
                "text-sm",
                isActive ? "text-primary font-medium" : "text-muted-foreground"
            )}>
                {label}
            </span>
        </button>
    );
};

export const HeaderSlot = ({ children }: PropsWithChildren) => {
    return (
        <div className="flex items-center gap-2">
            {children}
        </div>
    );
};

export default NavBarSlot;
