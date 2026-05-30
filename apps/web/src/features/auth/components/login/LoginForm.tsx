import { Field, FieldGroup, FieldLabel } from "@/components/ui/field.tsx";
import { type FormEvent, useState } from "react";
import { Input } from "@/components/ui/input.tsx";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

type LoginFormProps = {
    formId: string;
    onSubmit: (e: FormEvent<HTMLFormElement>) => void;
    errors?: { email?: string; password?: string };
    onBlur?: (field: 'email' | 'password', value: string) => void;
};

const LoginForm = ({ formId, onSubmit, errors, onBlur }: LoginFormProps) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <form id={formId} onSubmit={onSubmit} noValidate>
            <FieldGroup>
                <Field>
                    <FieldLabel htmlFor="email">E-mail</FieldLabel>
                    <Input
                        id="email"
                        type="email"
                        name="email"
                        placeholder="Seu e-mail"
                        className={cn("h-11 rounded-md", errors?.email && "border-destructive")}
                        onBlur={(e) => onBlur?.('email', e.target.value)}
                    />
                    {errors?.email && <p className="text-destructive text-[12px] mt-1">{errors.email}</p>}
                </Field>

                <Field>
                    <FieldLabel htmlFor="password">Senha</FieldLabel>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder="Sua senha"
                            className={cn("h-11 rounded-md pr-10", errors?.password && "border-destructive")}
                            onBlur={(e) => onBlur?.('password', e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    {errors?.password && <p className="text-destructive text-[12px] mt-1">{errors.password}</p>}
                </Field>
            </FieldGroup>
        </form>
    );
};

export default LoginForm;
