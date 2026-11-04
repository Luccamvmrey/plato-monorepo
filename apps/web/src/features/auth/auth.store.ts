import { create } from "zustand";
import type { User } from "./auth.types";
import { createJSONStorage, persist } from "zustand/middleware";

interface AuthState {
    token: string | null;
    user: User | null;
    login: (token: string, user: User) => void;
    setToken: (token: string) => void;
    logout: () => void;
    checkSession: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            token: null,
            user: null,

            login: (token, user) => set({ token, user }),

            setToken: (token) => set({ token }),

            logout: () => {
                set({ token: null, user: null });
            },

            checkSession: () => {
                const { token, logout } = get();
                if (!token) {
                    logout();
                }
            }
        }),
        {
            name: "plato-auth-storage",
            storage: createJSONStorage(() => localStorage),
        }
    )
)