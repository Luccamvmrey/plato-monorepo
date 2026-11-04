import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AuthService } from "@/features/auth/auth.service.ts";
import { isValidEmail } from "@/core/utils/validation.ts";

export const useForgotPasswordLogic = () => {
    const [emailError, setEmailError] = useState<string>();
    const mutation = useMutation({ mutationFn: AuthService.forgotPassword });

    const submit = (email: string) => {
        if (!isValidEmail(email)) {
            setEmailError("E-mail inválido.");
            return;
        }
        setEmailError(undefined);
        mutation.mutate(email);
    };

    return {
        submit,
        emailError,
        isLoading: mutation.isPending,
        wasSent: mutation.isSuccess,
        error: mutation.isError ? "Não foi possível enviar agora. Tente novamente em alguns minutos." : null,
    };
};
