import { useAuth } from "@/features/auth/hooks/useAuth.ts";
import { useLocation } from "wouter";
import { path } from "@/core/constants/path.ts";
import type { LoginRequest } from "@/features/auth/auth.types.ts";

export const useLoginLogic = () => {
    const { loginMutation } = useAuth();
    const [_, navigate] = useLocation();

    const FORM_ID = "login-form";

    const logUserIn = (data: LoginRequest) => {
        if (!data.email || !data.password) {
            console.warn("Missing email or password");
            return;
        }
        loginMutation.mutate(data);
    }

    const handleCreateAccount = () => {
        navigate(path.SIGNUP);
    }

    return {
        FORM_ID,
        logUserIn,
        isLoading: loginMutation.isPending,
        handleCreateAccount,
    }
}