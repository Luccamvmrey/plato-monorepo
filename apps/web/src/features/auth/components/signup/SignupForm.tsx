import { Field, FieldGroup, FieldLabel } from "@/components/ui/field.tsx";
import { type FormEvent, useState } from "react";
import { Input } from "@/components/ui/input.tsx";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPasswordStrength } from "@/core/utils/validation.ts";

type SignupFormProps = {
    formId: string;
    onSubmit: (e: FormEvent<HTMLFormElement>) => void;
    errors?: { name?: string; email?: string; password?: string };
    onBlur?: (field: 'name' | 'email' | 'password', value: string) => void;
};

const SignupForm = ({ formId, onSubmit, errors, onBlur }: SignupFormProps) => {
    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState("");

    const strength = getPasswordStrength(password);

    return (
        <form id={formId} onSubmit={onSubmit} noValidate>
            <FieldGroup>
                <Field>
                    <FieldLabel htmlFor="username">Nome de Usuário</FieldLabel>
                    <Input
                        id="username"
                        type="text"
                        name="username"
                        placeholder="Seu nome de usuário"
                        className={cn("h-11 rounded-md", errors?.name && "border-destructive")}
                        onBlur={(e) => onBlur?.('name', e.target.value)}
                    />
                    {errors?.name && <p className="text-destructive text-[12px] mt-1">{errors.name}</p>}
                </Field>

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
                            onChange={(e) => setPassword(e.target.value)}
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
                    {password && strength && (
                        <div className="mt-2 space-y-1">
                            <div className="flex gap-1">
                                {[0, 1, 2].map(i => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "h-1 flex-1 rounded-full transition-colors duration-200",
                                            i < { weak: 1, medium: 2, strong: 3 }[strength]
                                                ? { weak: "bg-destructive", medium: "bg-amber-400", strong: "bg-success" }[strength]
                                                : "bg-muted"
                                        )}
                                    />
                                ))}
                            </div>
                            <p className={cn("text-[11px]",
                                strength === 'weak' && "text-destructive",
                                strength === 'medium' && "text-amber-600",
                                strength === 'strong' && "text-success"
                            )}>
                                {{ weak: 'Fraca', medium: 'Média', strong: 'Forte' }[strength]}
                            </p>
                        </div>
                    )}
                    {errors?.password && <p className="text-destructive text-[12px] mt-1">{errors.password}</p>}
                </Field>
            </FieldGroup>
        </form>
    );
};

export default SignupForm;
