import { useAuth } from "@/features/auth/hooks/useAuth.ts";
import { useLocation } from "wouter";
import { path } from "@/core/constants/path.ts";
import type { RegisterRequest } from "@/features/auth/auth.types.ts";

export const useSignupLogic = () => {
    const { registerMutation } = useAuth();
    const [, navigate] = useLocation();

    const FORM_ID = "signup-form";

    const signup = (data: RegisterRequest) => {
        if (!data.email || !data.password || !data.name) {
            console.warn("Missing required fields for signup");
            return;
        }
        registerMutation.mutate(data);
    }

    const handleGoBack = () => {
        navigate(path.LOGIN);
    }

    return {
        FORM_ID,
        signup,
        isLoading: registerMutation.isPending,
        signupError: registerMutation.isError
            ? "Falha ao criar conta. Verifique os dados e tente novamente."
            : null,
        handleGoBack,
    }
}
