import { useAuthStore } from "@/features/auth/auth.store.ts";
import { useLocation } from "wouter";
import { path } from "@/core/constants/path.ts";

export const useBypassAuth = () => {
    const token = useAuthStore((state) => state.token);
    const isAuthenticated = !!token;
    const [, navigate] = useLocation();

    if (isAuthenticated) {
        navigate(path.WORKOUTS);
    }
}