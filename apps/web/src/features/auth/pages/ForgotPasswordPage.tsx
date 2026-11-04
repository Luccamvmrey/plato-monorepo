import type { FormEvent } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { InlineErrorBanner } from "@/core/components/InlineErrorBanner";
import { path } from "@/core/constants/path.ts";
import { useForgotPasswordLogic } from "@/features/auth/hooks/useForgotPasswordLogic.ts";

const FORM_ID = "forgot-password-form";

const ForgotPasswordPage = () => {
    const { submit, emailError, isLoading, wasSent, error } = useForgotPasswordLogic();

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        submit(new FormData(e.currentTarget).get("email") as string);
    };

    return (
        <div className="min-h-dvh w-screen flex flex-col bg-background overflow-y-auto px-4 py-8">
            <div className="m-auto w-full flex justify-center">
                <Card className="border border-border w-[75%]">
                    <CardHeader>
                        <CardTitle className="text-[20px] tracking-[-0.02em]">Redefinir senha</CardTitle>
                        <CardDescription>
                            {wasSent
                                ? "Se houver uma conta com esse e-mail, enviamos um link que vale por 1 hora. Confira também o spam."
                                : "Informe seu e-mail e enviaremos um link para criar uma nova senha."}
                        </CardDescription>
                    </CardHeader>

                    {!wasSent && (
                        <CardContent className="flex flex-col gap-3">
                            <form id={FORM_ID} onSubmit={handleSubmit} noValidate>
                                <FieldGroup>
                                    <Field>
                                        <FieldLabel htmlFor="email">E-mail</FieldLabel>
                                        <Input
                                            id="email"
                                            type="email"
                                            name="email"
                                            placeholder="Seu e-mail"
                                            autoComplete="email"
                                            inputMode="email"
                                            enterKeyHint="send"
                                            aria-invalid={!!emailError}
                                            aria-describedby={emailError ? "email-error" : undefined}
                                            className="h-11 rounded-md"
                                        />
                                        {emailError && (
                                            <p id="email-error" role="alert" className="text-destructive text-[12px] mt-1">
                                                {emailError}
                                            </p>
                                        )}
                                    </Field>
                                </FieldGroup>
                            </form>
                            {error && <InlineErrorBanner message={error} />}
                        </CardContent>
                    )}

                    <CardFooter className="flex flex-col gap-2">
                        {!wasSent && (
                            <Button type="submit" form={FORM_ID} className="w-full h-12 font-medium" disabled={isLoading}>
                                {isLoading && <Spinner data-icon="inline-start" />}
                                {isLoading ? "Enviando..." : "Enviar link"}
                            </Button>
                        )}
                        <Button variant="link" asChild className="w-full">
                            <Link href={path.LOGIN}>Voltar para o login</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
