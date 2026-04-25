import { Field, FieldGroup, FieldLabel } from "@/components/ui/field.tsx";
import type { FormEvent } from "react";
import { Input } from "@/components/ui/input.tsx";

type SignupFormProps = {
    formId: string;
    onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

const SignupForm = ({ formId, onSubmit }: SignupFormProps) => {
    return (
        <form id={formId} onSubmit={onSubmit}>
            <FieldGroup>
                <Field>
                    <FieldLabel htmlFor="username">Nome de Usuário</FieldLabel>
                    <Input
                        id="username"
                        type="text"
                        name="username"
                        placeholder="Seu nome de usuário"
                        required
                    />
                </Field>

                <Field>
                    <FieldLabel htmlFor="email">E-mail</FieldLabel>
                    <Input
                        id="email"
                        type="email"
                        name="email"
                        placeholder="Seu e-mail"
                        required
                    />
                </Field>

                <Field>
                    <FieldLabel htmlFor="password">Senha</FieldLabel>
                    <Input
                        id="password"
                        type="password"
                        name="password"
                        required
                    />
                </Field>
            </FieldGroup>
        </form>
    );
};

export default SignupForm;