import { useAuthStore } from "@/features/auth/auth.store.ts";
import { useLocation } from "wouter";
import { path } from "@/core/constants/path.ts";
import { useReturnPath } from "@/features/auth/hooks/useReturnPath.ts";

export const useBypassAuth = () => {
    const token = useAuthStore((state) => state.token);
    const isAuthenticated = !!token;
    const [, navigate] = useLocation();
    const { returnPath } = useReturnPath();

    if (isAuthenticated) {
        navigate(returnPath ?? path.WORKOUTS);
    }
}
