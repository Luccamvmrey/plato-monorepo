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
        <div
            className="flex flex-col items-center justify-center gap-2 size-[64px]"
            onClick={handleClick}
        >
            <div className="relative size-8 flex items-center justify-center">
                <Icon className={isActive ? "text-primary" : "text-muted-foreground"}/>

                {showBadge && (
                    <span
                        className="absolute top-0 right-0 size-2.5 bg-primary rounded-full border-2 border-background animate-pulse"/>
                )}
            </div>
            <span className={cn(
                "text-sm",
                isActive ? "text-primary font-medium" : "text-muted-foreground"
            )}>
                {label}
            </span>
        </div>
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
