import { Dumbbell, History, UserRound, Zap } from "lucide-react";
import NavBarSlot from "@/core/components/NavBarSlot.tsx";
import { path } from "@/core/constants/path.ts";
import { useKeyboardOpen } from "@/core/hooks/useKeyboardOpen.ts";
import { useWorkoutSession } from "@/features/workouts/hooks/useWorkoutSession.ts";
import { cn } from "@/lib/utils.ts";

const NavBar = () => {
    const { findActiveSessionQuery } = useWorkoutSession();
    const hasActiveSession = !!findActiveSessionQuery.data?.activeSession;
    const isKeyboardOpen = useKeyboardOpen();

    return (
        <nav
            aria-label="Navegação principal"
            className={cn(
                // h-navbar = 92px + env(safe-area-inset-bottom), para a barra não
                // ficar parcialmente sob o home indicator em PWA standalone.
                "w-screen h-navbar z-50 fixed bottom-0 left-0 right-0 shadow-2xl border-t rounded-t-3xl p-4 flex items-center justify-around bg-background",
                // While typing the keyboard already occupies the bottom of the screen;
                // keeping the bar mounted here would steal ~92px and cover the controls
                // the user is reaching for.
                isKeyboardOpen && "hidden"
            )}
        >
            <NavBarSlot
                link={path.WORKOUTS}
                slotIcon={Dumbbell}
                label="Treinos"
            />
            <NavBarSlot
                link={path.HISTORY}
                slotIcon={History}
                label="Histórico"
            />
            <NavBarSlot
                link={path.ACTIVE_WORKOUT}
                slotIcon={Zap}
                label="Sessão"
                showBadge={hasActiveSession}
            />
            <NavBarSlot
                link={path.USER_PROFILE}
                slotIcon={UserRound}
                label="Perfil"
            />
        </nav>
    );
};

export default NavBar;
