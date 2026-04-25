import { Dumbbell, History, UserRound, Zap } from "lucide-react";
import NavBarSlot from "@/core/components/NavBarSlot.tsx";
import { path } from "@/core/constants/path.ts";
import { useWorkoutSession } from "@/features/workouts/hooks/useWorkoutSession.ts";

const NavBar = () => {
    const { findActiveSessionQuery } = useWorkoutSession();
    const hasActiveSession = !!findActiveSessionQuery.data?.activeSession;

    return (
        <div className="w-screen h-[92px] z-50 fixed bottom-0 left-0 right-0 shadow-2xl border-t rounded-t-3xl p-4 flex items-center justify-around bg-background">
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
        </div>
    );
};

export default NavBar;
