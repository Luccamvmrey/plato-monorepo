import type { PropsWithChildren } from "react";
import NavBar from "@/core/components/NavBar.tsx";
import { useKeepFocusedFieldVisible } from "@/core/hooks/useKeepFocusedFieldVisible.ts";
import { useKeyboardOpen } from "@/core/hooks/useKeyboardOpen.ts";
import { cn } from "@/lib/utils.ts";
import { useNotificationLifecycle } from "@/features/notifications/hooks/useNotificationLifecycle.ts";
import { useRestAlert } from "@/features/notifications/hooks/useRestAlert.ts";
import { useSessionDraftSync } from "@/features/workouts/hooks/useSessionDraftSync.ts";
import { ActiveSessionBanner } from "@/features/workouts/components/active-workout/components/ActiveSessionBanner.tsx";

const Layout = ({ children }: PropsWithChildren) => {
    const isKeyboardOpen = useKeyboardOpen();
    useKeepFocusedFieldVisible();
    useNotificationLifecycle();
    useRestAlert();
    useSessionDraftSync();

    return (
        <main className={cn("min-h-dvh flex flex-1 flex-col", !isKeyboardOpen && "pb-navbar")}>
            {/* The NavBar is hidden while the keyboard is up, so the space it
                reserves has to be given back — otherwise the padding alone keeps
                the content pushed above the fold. pb-navbar/mb-navbar carregam o
                env(safe-area-inset-bottom) junto com a altura da barra. */}
            <ActiveSessionBanner />
            <div className={cn("flex-1 p-4", !isKeyboardOpen && "mb-navbar")}>
                {children}
            </div>
            <NavBar />
        </main>
    );
};

export default Layout;
