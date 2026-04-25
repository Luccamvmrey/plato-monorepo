import { useState, useEffect } from "react";

export const useWorkoutTimer = (startedAt: string | Date | undefined) => {
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    useEffect(() => {
        if (!startedAt) return;
        
        const startTime = new Date(startedAt).getTime();
        
        const updateTimer = () => {
            const now = Date.now();
            setElapsedSeconds(Math.floor((now - startTime) / 1000));
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [startedAt]);

    return { elapsedSeconds };
};
