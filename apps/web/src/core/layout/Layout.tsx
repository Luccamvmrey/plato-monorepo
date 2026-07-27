import type { PropsWithChildren } from "react";
import NavBar from "@/core/components/NavBar.tsx";
import { useKeepFocusedFieldVisible } from "@/core/hooks/useKeepFocusedFieldVisible.ts";
import { useKeyboardOpen } from "@/core/hooks/useKeyboardOpen.ts";
import { cn } from "@/lib/utils.ts";

const Layout = ({ children }: PropsWithChildren) => {
    const isKeyboardOpen = useKeyboardOpen();
    useKeepFocusedFieldVisible();

    return (
        <main className={cn("min-h-dvh flex flex-1 flex-col gap-4", !isKeyboardOpen && "pb-[84px]")}>
            {/* The NavBar is hidden while the keyboard is up, so the space it
                reserves has to be given back — otherwise the padding alone keeps
                the content pushed above the fold. */}
            <div className={cn("flex-1 p-4", !isKeyboardOpen && "mb-[96px]")}>
                {children}
            </div>
            <NavBar />
        </main>
    );
};

export default Layout;
