import { z } from "zod";

export const registerSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    name: z.string().min(2, "Name is required"),
    acceptedTerms: z.literal(true, "Terms must be accepted"),
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
export const updateUserSchema = registerSchema.omit({ password: true, acceptedTerms: true }).partial()

export type UpdateUserInput = z.infer<typeof updateUserSchema>