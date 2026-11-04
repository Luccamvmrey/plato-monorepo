import LoginForm from "@/features/auth/components/login/LoginForm.tsx";
import AuthFormLayout from "@/features/auth/components/AuthFormLayout.tsx";
import { Button } from "@/components/ui/button.tsx";
import { useLoginLogic } from "@/features/auth/hooks/useLoginLogic.ts";
import type { FormEvent } from "react";
import { Spinner } from "@/components/ui/spinner.tsx";
import { InlineErrorBanner } from "@/core/components/InlineErrorBanner";

const LoginCard = () => {
    const { FORM_ID, logUserIn, isLoading, loginError, handleCreateAccount, errors, handleBlur } = useLoginLogic();

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);
        logUserIn({
            email: formData.get("email") as string,
            password: formData.get("password") as string
        });
    };

    return (
        <AuthFormLayout
            title="Bem-vindo de volta ao Plato!"
            description="Faça login em sua conta."
            footer={
                <>
                    <Button
                        type="submit"
                        form={FORM_ID}
                        className="w-full h-12 font-medium tracking-[-0.01em]"
                        disabled={isLoading}
                    >
                        {/* Submit, não fetch: os botões já ficam disabled, então o
                            scrim de tela cheia não acrescentava informação. */}
                        {isLoading && <Spinner data-icon="inline-start" />}
                        {isLoading ? "Entrando..." : "Entrar"}
                    </Button>

                    <Button
                        variant="link"
                        onClick={handleCreateAccount}
                        className="w-full"
                        disabled={isLoading}
                    >
                        Criar conta
                    </Button>
                </>
            }
        >
            <LoginForm
                formId={FORM_ID}
                onSubmit={handleSubmit}
                errors={errors}
                onBlur={handleBlur}
            />
            {loginError && <InlineErrorBanner message={loginError} />}
        </AuthFormLayout>
    );
};

export default LoginCard;
