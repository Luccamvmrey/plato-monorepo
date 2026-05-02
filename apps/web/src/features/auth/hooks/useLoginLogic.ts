import { useAuth } from "@/features/auth/hooks/useAuth.ts";
import { useLocation } from "wouter";
import { path } from "@/core/constants/path.ts";
import type { LoginRequest } from "@/features/auth/auth.types.ts";
import { useState } from "react";
import { isValidEmail } from "@/core/utils/validation.ts";

type LoginErrors = { email?: string; password?: string };

export const useLoginLogic = () => {
    const { loginMutation } = useAuth();
    const [, navigate] = useLocation();
    const [errors, setErrors] = useState<LoginErrors>({});

    const FORM_ID = "login-form";

    const handleBlur = (field: 'email' | 'password', value: string) => {
        setErrors(prev => {
            const next = { ...prev };
            if (field === 'email') {
                if (!value) {
                    next.email = "E-mail é obrigatório.";
                } else if (!isValidEmail(value)) {
                    next.email = "E-mail inválido.";
                } else {
                    delete next.email;
                }
            }
            if (field === 'password') {
                if (!value) {
                    next.password = "Senha é obrigatória.";
                } else {
                    delete next.password;
                }
            }
            return next;
        });
    };

    const logUserIn = (data: LoginRequest) => {
        const newErrors: LoginErrors = {};
        if (!data.email) {
            newErrors.email = "E-mail é obrigatório.";
        } else if (!isValidEmail(data.email)) {
            newErrors.email = "E-mail inválido.";
        }
        if (!data.password) {
            newErrors.password = "Senha é obrigatória.";
        }
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
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
        loginError: loginMutation.isError
            ? "Falha ao fazer login. Verifique suas credenciais e tente novamente."
            : null,
        handleCreateAccount,
        errors,
        handleBlur,
    }
}
