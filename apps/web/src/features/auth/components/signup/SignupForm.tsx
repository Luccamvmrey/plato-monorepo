import { Field, FieldGroup, FieldLabel } from "@/components/ui/field.tsx";
import { type FormEvent, useState } from "react";
import { Input } from "@/components/ui/input.tsx";
import { Eye, EyeOff } from "lucide-react";

type SignupFormProps = {
    formId: string;
    onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

const SignupForm = ({ formId, onSubmit }: SignupFormProps) => {
    const [showPassword, setShowPassword] = useState(false);

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
                        className="h-11 rounded-md"
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
                        className="h-11 rounded-md"
                        required
                    />
                </Field>

                <Field>
                    <FieldLabel htmlFor="password">Senha</FieldLabel>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder="Sua senha"
                            className="h-11 rounded-md pr-10"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </Field>
            </FieldGroup>
        </form>
    );
};

export default SignupForm;
