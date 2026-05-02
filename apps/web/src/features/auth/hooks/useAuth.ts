import { useAuthStore } from "@/features/auth/auth.store.ts";
import { useMutation } from "@tanstack/react-query";
import { AuthService } from "@/features/auth/auth.service.ts";
import type { LoginResponse, RegisterResponse } from "@/features/auth/auth.types.ts";
import { useLocation } from "wouter";
import { path } from "@/core/constants/path.ts";

export const useAuth = () => {
    const [, navigate] = useLocation();
    const login = useAuthStore((state) => state.login);

    const loginMutation = useMutation({
        mutationFn: AuthService.login,
        onSuccess: (data: LoginResponse) => {
            login(data.token, data.user);
            navigate(path.WORKOUTS);
        },
    });

    const registerMutation = useMutation({
        mutationFn: AuthService.register,
        onSuccess: (_data: RegisterResponse) => {
            navigate(path.LOGIN);
        },
    });

    return {
        loginMutation,
        registerMutation,
    }
}
