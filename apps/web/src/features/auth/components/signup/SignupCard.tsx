import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { useSignupLogic } from "@/features/auth/hooks/useSignupLogic.ts";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button.tsx";
import { ArrowLeft } from "lucide-react";
import SignupForm from "@/features/auth/components/signup/SignupForm.tsx";
import { LoadingOverlay } from "@/components/ui/loading-overlay.tsx";

const SignupCard = () => {
    const { FORM_ID, signup, isLoading, handleGoBack } = useSignupLogic();

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        signup({
            email: formData.get("email") as string,
            password: formData.get("password") as string,
            name: formData.get("username") as string,
        })
    }

    return (
        <div className="flex flex-col w-[75%] gap-4">
            <Card className="border border-border">
                <CardHeader>
                    <CardTitle className="text-[20px] tracking-[-0.02em]">Bem-vindo ao Plato!</CardTitle>
                    <CardDescription>
                        Crie uma conta para treinar conosco.
                    </CardDescription>
                    <CardAction>
                        <Button variant="ghost" size="icon" onClick={handleGoBack}>
                            <ArrowLeft/>
                        </Button>
                    </CardAction>
                </CardHeader>

                <CardContent>
                    <SignupForm
                        formId={FORM_ID}
                        onSubmit={handleSubmit}
                    />
                </CardContent>

                <CardFooter>
                    <Button
                        type="submit"
                        form={FORM_ID}
                        className="flex-1 h-12 font-medium tracking-[-0.01em]"
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

export default SignupCard;