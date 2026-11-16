import { useEffect, useState } from "react";
import { formatClock } from "@/core/utils/formatters.ts";

/** "0:42" desde a montagem, atualizado a cada segundo. Remontar recomeça do zero. */
export const useElapsedClock = () => {
    const [startedAt] = useState(() => Date.now());
    const [now, setNow] = useState(startedAt);

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    return formatClock(Math.max(0, Math.floor((now - startedAt) / 1000)));
};
