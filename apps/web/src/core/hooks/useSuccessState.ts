import { useState, useCallback } from "react";

export function useSuccessState(duration = 1500) {
    const [isSuccess, setIsSuccess] = useState(false);

    const trigger = useCallback(() => {
        setIsSuccess(true);
        setTimeout(() => setIsSuccess(false), duration);
    }, [duration]);

    return { isSuccess, trigger };
}
