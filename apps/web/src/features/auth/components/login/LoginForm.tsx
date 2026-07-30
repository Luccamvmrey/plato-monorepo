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
                        autoComplete="email"
                        inputMode="email"
                        enterKeyHint="next"
                        aria-invalid={!!errors?.email}
                        aria-describedby={errors?.email ? "email-error" : undefined}
                        className={cn("h-11 rounded-md", errors?.email && "border-destructive")}
                        onBlur={(e) => onBlur?.('email', e.target.value)}
                    />
                    {errors?.email && (
                        <p id="email-error" role="alert" className="text-destructive text-[12px] mt-1">
                            {errors.email}
                        </p>
                    )}
                </Field>

                <Field>
                    <FieldLabel htmlFor="password">Senha</FieldLabel>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder="Sua senha"
                            autoComplete="current-password"
                            enterKeyHint="go"
                            aria-invalid={!!errors?.password}
                            aria-describedby={errors?.password ? "password-error" : undefined}
                            className={cn("h-11 rounded-md pr-10", errors?.password && "border-destructive")}
                            onBlur={(e) => onBlur?.('password', e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(v => !v)}
                            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                            aria-pressed={showPassword}
                            className="absolute right-1 top-1/2 -translate-y-1/2 size-9 flex items-center justify-center
                                       rounded-md text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    {errors?.password && (
                        <p id="password-error" role="alert" className="text-destructive text-[12px] mt-1">
                            {errors.password}
                        </p>
                    )}
                </Field>
            </FieldGroup>
        </form>
    );
};

export default LoginForm;
