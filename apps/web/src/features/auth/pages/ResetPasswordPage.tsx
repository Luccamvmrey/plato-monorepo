import type { FormEvent } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { InlineErrorBanner } from "@/core/components/InlineErrorBanner";
import { path } from "@/core/constants/path.ts";
import { useResetPasswordLogic } from "@/features/auth/hooks/useResetPasswordLogic.ts";

const FORM_ID = "reset-password-form";

const ResetPasswordPage = () => {
    const { submit, passwordError, hasToken, isLoading, wasReset, error } = useResetPasswordLogic();

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        submit(formData.get("password") as string, formData.get("confirmation") as string);
    };

    const showForm = hasToken && !wasReset;

    const description = wasReset
        ? "Senha alterada. Por segurança, encerramos as outras sessões da sua conta."
        : hasToken
            ? "Escolha uma nova senha com pelo menos 8 caracteres."
            : "Este link está incompleto. Peça um novo para continuar.";

    return (
        <div className="min-h-dvh w-screen flex flex-col bg-background overflow-y-auto px-4 py-8">
            <div className="m-auto w-full flex justify-center">
                <Card className="border border-border w-[75%]">
                    <CardHeader>
                        <CardTitle className="text-[20px] tracking-[-0.02em]">Nova senha</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </CardHeader>

                    {showForm && (
                        <CardContent className="flex flex-col gap-3">
                            <form id={FORM_ID} onSubmit={handleSubmit} noValidate>
                                <FieldGroup>
                                    <Field>
                                        <FieldLabel htmlFor="password">Nova senha</FieldLabel>
                                        <Input
                                            id="password"
                                            type="password"
                                            name="password"
                                            autoComplete="new-password"
                                            enterKeyHint="next"
                                            aria-invalid={!!passwordError}
                                            className="h-11 rounded-md"
                                        />
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor="confirmation">Confirme a nova senha</FieldLabel>
                                        <Input
                                            id="confirmation"
                                            type="password"
                                            name="confirmation"
                                            autoComplete="new-password"
                                            enterKeyHint="go"
                                            aria-invalid={!!passwordError}
                                            aria-describedby={passwordError ? "password-error" : undefined}
                                            className="h-11 rounded-md"
                                        />
                                        {passwordError && (
                                            <p id="password-error" role="alert" className="text-destructive text-[12px] mt-1">
                                                {passwordError}
                                            </p>
                                        )}
                                    </Field>
                                </FieldGroup>
                            </form>
                            {error && <InlineErrorBanner message={error} />}
                        </CardContent>
                    )}

                    <CardFooter className="flex flex-col gap-2">
                        {showForm && (
                            <Button type="submit" form={FORM_ID} className="w-full h-12 font-medium" disabled={isLoading}>
                                {isLoading && <Spinner data-icon="inline-start" />}
                                {isLoading ? "Salvando..." : "Salvar nova senha"}
                            </Button>
                        )}
                        {(!hasToken || error) && (
                            <Button variant="link" asChild className="w-full">
                                <Link href={path.FORGOT_PASSWORD}>Pedir novo link</Link>
                            </Button>
                        )}
                        <Button variant={wasReset ? "default" : "link"} asChild className="w-full">
                            <Link href={path.LOGIN}>Ir para o login</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
