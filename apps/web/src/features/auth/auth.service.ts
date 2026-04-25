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
    }
}