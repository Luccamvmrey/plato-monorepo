import { useAuth } from "@/features/auth/hooks/useAuth.ts";
import { useLocation } from "wouter";
import { path } from "@/core/constants/path.ts";
import type { RegisterRequest } from "@/features/auth/auth.types.ts";
import { useState } from "react";
import { isValidEmail } from "@/core/utils/validation.ts";
import { type AxiosError } from "axios";

type SignupErrors = { name?: string; email?: string; password?: string };

export const useSignupLogic = () => {
    const { registerMutation } = useAuth();
    const [, navigate] = useLocation();
    const [errors, setErrors] = useState<SignupErrors>({});

    const FORM_ID = "signup-form";

    const handleBlur = (field: 'name' | 'email' | 'password', value: string) => {
        setErrors(prev => {
            const next = { ...prev };
            if (field === 'name') {
                if (!value) {
                    next.name = "Nome é obrigatório.";
                } else {
                    delete next.name;
                }
            }
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
                if (value.length > 0 && value.length < 8) {
                    next.password = "A senha deve ter pelo menos 8 caracteres.";
                } else {
                    delete next.password;
                }
            }
            return next;
        });
    };

    const signup = (data: RegisterRequest) => {
        const newErrors: SignupErrors = {};
        if (!data.name) {
            newErrors.name = "Nome é obrigatório.";
        }
        if (!data.email) {
            newErrors.email = "E-mail é obrigatório.";
        } else if (!isValidEmail(data.email)) {
            newErrors.email = "E-mail inválido.";
        }
        if (!data.password || data.password.length < 8) {
            newErrors.password = "A senha deve ter pelo menos 8 caracteres.";
        }
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        registerMutation.mutate(data);
    }

    const handleGoBack = () => {
        navigate(path.LOGIN);
    }

    const emailTakenError = registerMutation.isError && (registerMutation.error as AxiosError)?.response?.status === 409
        ? "E-mail já cadastrado."
        : undefined;

    const combinedErrors = { ...errors, ...(emailTakenError ? { email: emailTakenError } : {}) };

    return {
        FORM_ID,
        signup,
        isLoading: registerMutation.isPending,
        signupError: registerMutation.isError && !emailTakenError
            ? "Falha ao criar conta. Verifique os dados e tente novamente."
            : null,
        handleGoBack,
        errors: combinedErrors,
        handleBlur,
    }
}
