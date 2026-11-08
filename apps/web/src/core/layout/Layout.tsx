import type { PropsWithChildren } from "react";
import NavBar from "@/core/components/NavBar.tsx";
import { useKeepFocusedFieldVisible } from "@/core/hooks/useKeepFocusedFieldVisible.ts";
import { useKeyboardOpen } from "@/core/hooks/useKeyboardOpen.ts";
import { cn } from "@/lib/utils.ts";
import { useNotificationLifecycle } from "@/features/notifications/hooks/useNotificationLifecycle.ts";
import { useRestAlert } from "@/features/notifications/hooks/useRestAlert.ts";
import { useSessionDraftSync } from "@/features/workouts/hooks/useSessionDraftSync.ts";
import { ActiveSessionBanner } from "@/features/workouts/components/active-workout/components/ActiveSessionBanner.tsx";
import { useSessionFocusMode } from "@/features/workouts/hooks/useSessionFocusMode.ts";

const Layout = ({ children }: PropsWithChildren) => {
    const isKeyboardOpen = useKeyboardOpen();
    // Durante o treino a NavBar sai: eram 92px fixos numa tela que já empilha
    // descanso e Finalizar. A saída da sessão passa a ser o "<" do cabeçalho.
    const isFocusMode = useSessionFocusMode();
    const reservesNavBar = !isKeyboardOpen && !isFocusMode;
    useKeepFocusedFieldVisible();
    useNotificationLifecycle();
    useRestAlert();
    useSessionDraftSync();

    return (
        <main className={cn("min-h-dvh flex flex-1 flex-col", reservesNavBar && "pb-navbar")}>
            {/* The NavBar is hidden while the keyboard is up, so the space it
                reserves has to be given back — otherwise the padding alone keeps
                the content pushed above the fold. pb-navbar/mb-navbar carregam o
                env(safe-area-inset-bottom) junto com a altura da barra. */}
            <ActiveSessionBanner />
            <div className={cn("flex-1 p-4", reservesNavBar && "mb-navbar")}>
                {children}
            </div>
            {!isFocusMode && <NavBar />}
        </main>
    );
};

export default Layout;
