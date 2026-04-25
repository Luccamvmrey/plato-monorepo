import { useAuthStore } from "@/features/auth/auth.store.ts";
import { useEffect } from "react";

export const useCheckSession = () => {
    const checkSession = useAuthStore((state) => state.checkSession);

    useEffect(() => {
        checkSession();
    }, [checkSession]);
}