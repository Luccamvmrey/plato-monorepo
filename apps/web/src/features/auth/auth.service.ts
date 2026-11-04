import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from "@/features/auth/auth.types.ts";
import api from "@/core/api";

export const AuthService = {
    login: async (credentials: LoginRequest) => {
        const { data } = await api.post<LoginResponse>("/auth/login", credentials);
        return data;
    },

    register: async (credentials: RegisterRequest) => {
        const { data } = await api.post<RegisterResponse>("/auth/register", credentials);
        return data;
    },

    refresh: async () => {
        const { data } = await api.post<{ token: string }>("/auth/refresh");
        return data.token;
    },

    forgotPassword: async (email: string) => {
        await api.post("/auth/forgot-password", { email });
    },

    resetPassword: async (payload: { token: string; password: string }) => {
        await api.post("/auth/reset-password", payload);
    }
}