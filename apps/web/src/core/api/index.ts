import axios from "axios";
import { useAuthStore } from "@/features/auth/auth.store.ts";

const rawBaseURL = import.meta.env.VITE_API_URL;

// 2. Define a baseURL de forma limpa
// Se existir rawBaseURL, usa ela + /api. Se não, usa apenas /api (fallback para dev/proxy)
const finalBaseURL = rawBaseURL
    ? `${rawBaseURL.replace(/\/$/, '')}/api`
    : '/api';

if (!rawBaseURL && import.meta.env.PROD) {
    console.warn("VITE_API_URL não encontrada. As requisições podem falhar em produção.");
}

const api = axios.create({
    baseURL: finalBaseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            useAuthStore.getState().logout();
        }
        return Promise.reject(error);
    }
);

export default api;