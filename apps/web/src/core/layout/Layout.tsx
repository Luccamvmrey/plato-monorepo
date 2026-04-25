import type { PropsWithChildren } from "react";
import NavBar from "@/core/components/NavBar.tsx";

const Layout = ({ children }: PropsWithChildren) => {
    return (
        <main className="h-screen flex flex-1 flex-col gap-4 pb-[84px]">
            <div className="flex-1 p-4 mb-[96px]">
                {children}
            </div>
            <NavBar />
        </main>
    );
};

export default Layout;