import { createRoot } from "react-dom/client"
import { MotionConfig } from "framer-motion"

import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/core/context/ThemeProvider.tsx";

createRoot(document.getElementById("root")!).render(
    <ThemeProvider defaultTheme="dark" storageKey="plato-theme">
        {/* reducedMotion="user" respeita prefers-reduced-motion em todo motion
            component da app — inclusive os que renderizam via portal (sheets,
            dialogs), que estão fora do root div mas dentro da árvore React.
            As animações puramente CSS (animate-pulse) são tratadas no index.css. */}
        <MotionConfig reducedMotion="user">
            <App/>
        </MotionConfig>
    </ThemeProvider>
)
