import { useAuthStore } from "@/features/auth/auth.store.ts";
import { useMutation } from "@tanstack/react-query";
import { AuthService } from "@/features/auth/auth.service.ts";
import type { LoginResponse, RegisterResponse } from "@/features/auth/auth.types.ts";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { path } from "@/core/constants/path.ts";

export const useAuth = () => {
    const [_, navigate] = useLocation();
    const login = useAuthStore((state) => state.login);

    const loginMutation = useMutation({
        mutationFn: AuthService.login,
        onSuccess: (data: LoginResponse) => {
            login(data.token, data.user);
            navigate(path.WORKOUTS);
        },
        onError: (error: any) => {
            toast.error("Falha ao fazer login. Verifique suas credenciais e tente novamente.");
            console.error("Login error:", error);
        }
    });

    const registerMutation = useMutation({
        mutationFn: AuthService.register,
        onSuccess: (data: RegisterResponse) => {
            toast.success(`Conta criada, ${data.name}! Agora você pode fazer login.`);
            navigate(path.LOGIN);
        },
        onError: (error: any) => {
            toast.error("Falha ao criar conta. Verifique os dados e tente novamente.");
            console.error("Registration error:", error);
        }
    })

    return {
        loginMutation,
        registerMutation,
    }
}