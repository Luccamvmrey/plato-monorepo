import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/core/context/ThemeProvider.tsx";

createRoot(document.getElementById("root")!).render(
    <ThemeProvider defaultTheme="dark" storageKey="plato-theme">
        <App/>
    </ThemeProvider>
)
