import { z } from "zod";

export const registerSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    name: z.string().min(2, "Name is required"),
});

export const loginSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string(),
});

// `password` fica de fora de propósito: o service não passa por hashPassword, então
// aceitar a senha aqui gravaria texto puro no banco. Troca de senha é fluxo próprio.
export const updateUserSchema = registerSchema.omit({ password: true }).partial()

export type UpdateUserInput = z.infer<typeof updateUserSchema>