import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useSearch } from "wouter";
import { AuthService } from "@/features/auth/auth.service.ts";

const MIN_PASSWORD_LENGTH = 8;

export const useResetPasswordLogic = () => {
    const token = new URLSearchParams(useSearch()).get("token");
    const [passwordError, setPasswordError] = useState<string>();
    const mutation = useMutation({ mutationFn: AuthService.resetPassword });

    const submit = (password: string, confirmation: string) => {
        if (password.length < MIN_PASSWORD_LENGTH) {
            setPasswordError("A senha deve ter pelo menos 8 caracteres.");
            return;
        }
        if (password !== confirmation) {
            setPasswordError("As senhas não são iguais.");
            return;
        }
        setPasswordError(undefined);
        if (token) {
            mutation.mutate({ token, password });
        }
    };

    return {
        submit,
        passwordError,
        hasToken: !!token,
        isLoading: mutation.isPending,
        wasReset: mutation.isSuccess,
        error: mutation.isError ? "Este link é inválido ou expirou. Peça um novo." : null,
    };
};
