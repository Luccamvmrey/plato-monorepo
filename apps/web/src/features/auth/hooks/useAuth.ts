import { useAuthStore } from "@/features/auth/auth.store.ts";
import { useMutation } from "@tanstack/react-query";
import { AuthService } from "@/features/auth/auth.service.ts";
import type { LoginResponse, RegisterRequest, RegisterResponse } from "@/features/auth/auth.types.ts";
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

    // O /auth/register não devolve token, então encadeamos um login com as mesmas
    // credenciais para o usuário não ter que redigitar o que acabou de escolher.
    const registerMutation = useMutation({
        mutationFn: AuthService.register,
        onSuccess: (_data: RegisterResponse, variables: RegisterRequest) => {
            loginMutation.mutate(
                { email: variables.email, password: variables.password },
                { onError: () => navigate(path.LOGIN) }
            );
        },
    });

    return {
        loginMutation,
        registerMutation,
    }
}
