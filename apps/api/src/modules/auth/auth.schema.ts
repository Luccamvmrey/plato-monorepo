import { z } from "zod";

export const registerSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    name: z.string().min(2, "Name is required"),
    acceptedTerms: z.literal(true, "Terms must be accepted"),
    /// Link que trouxe a pessoa. Sem validar o formato aqui: token ruim não pode barrar o
    /// cadastro, então quem decide se ele vale é o service.
    sharedPlanToken: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
    email: z.string().email("Invalid email format"),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, "Token is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string(),
});

// `password` fica de fora de propósito: o service não passa por hashPassword, então
// aceitar a senha aqui gravaria texto puro no banco. Troca de senha é fluxo próprio.
export const updateUserSchema = registerSchema
    .omit({ password: true, acceptedTerms: true, sharedPlanToken: true })
    .extend({ trackingMode: z.enum(["FULL", "SIMPLE"]) })
    .partial()

export type UpdateUserInput = z.infer<typeof updateUserSchema>