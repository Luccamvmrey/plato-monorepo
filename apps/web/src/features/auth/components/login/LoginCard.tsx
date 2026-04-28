import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import LoginForm from "@/features/auth/components/login/LoginForm.tsx";
import { Button } from "@/components/ui/button.tsx";
import { useLoginLogic } from "@/features/auth/hooks/useLoginLogic.ts";
import type { FormEvent } from "react";
import { LoadingOverlay } from "@/components/ui/loading-overlay.tsx";

const LoginCard = () => {
    const { FORM_ID, logUserIn, isLoading, handleCreateAccount } = useLoginLogic();

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);
        logUserIn({
            email: formData.get("email") as string,
            password: formData.get("password") as string
        });
    };

    return (
        <div className="flex flex-col w-[75%] gap-4">
            <Card className="border border-border">
                <CardHeader>
                    <CardTitle className="text-[20px] tracking-[-0.02em]">Bem-vindo de volta ao Plato!</CardTitle>
                    <CardDescription>
                        Faça login em sua conta.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <LoginForm
                        formId={FORM_ID}
                        onSubmit={handleSubmit}
                    />
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    <Button
                        type="submit"
                        form={FORM_ID}
                        className="w-full h-12 font-medium tracking-[-0.01em]"
                        disabled={isLoading}
                    >
                        Entrar
                    </Button>

                    <Button
                        variant="link"
                        onClick={handleCreateAccount}
                        className="w-full"
                        disabled={isLoading}
                    >
                        Criar conta
                    </Button>
                </CardFooter>
            </Card>
            <LoadingOverlay isLoading={isLoading}/>
        </div>
    );
};

export default LoginCard;