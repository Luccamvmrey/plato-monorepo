import AuthFormLayout from "@/features/auth/components/AuthFormLayout.tsx";
import { useSignupLogic } from "@/features/auth/hooks/useSignupLogic.ts";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button.tsx";
import { ArrowLeft } from "lucide-react";
import SignupForm from "@/features/auth/components/signup/SignupForm.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { InlineErrorBanner } from "@/core/components/InlineErrorBanner";

const SignupCard = () => {
    const { FORM_ID, signup, isLoading, signupError, handleGoBack, errors, handleBlur } = useSignupLogic();

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        signup({
            email: formData.get("email") as string,
            password: formData.get("password") as string,
            name: formData.get("username") as string,
            acceptedTerms: formData.get("acceptedTerms") === "on",
        })
    }

    return (
        <AuthFormLayout
            title="Bem-vindo ao Plato!"
            description="Crie uma conta para treinar conosco."
            action={
                <Button variant="ghost" size="icon" className="relative tap-target shrink-0" aria-label="Voltar" onClick={handleGoBack}>
                    <ArrowLeft/>
                </Button>
            }
            footer={
                <Button
                    type="submit"
                    form={FORM_ID}
                    className="w-full h-12 font-medium tracking-[-0.01em]"
                    disabled={isLoading}
                >
                    {/* Cadastro encadeia register + login, então demora mais que
                        um submit comum, mas o retorno cabe no botão. */}
                    {isLoading && <Spinner data-icon="inline-start" />}
                    {isLoading ? "Criando conta..." : "Criar conta"}
                </Button>
            }
        >
            <SignupForm
                formId={FORM_ID}
                onSubmit={handleSubmit}
                errors={errors}
                onBlur={handleBlur}
            />
            {signupError && <InlineErrorBanner message={signupError} />}
        </AuthFormLayout>
    );
};

export default SignupCard;
