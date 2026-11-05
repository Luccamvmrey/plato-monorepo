import { create } from "zustand";
import type { User } from "./auth.types";
import { createJSONStorage, persist } from "zustand/middleware";
import { releaseDeviceOnLogout } from "@/features/notifications/utils/push-support.ts";

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
                const { token } = get();

                // Nada pode travar a saída da conta: sem rede, o próximo envio recebe 410.
                if (token) void releaseDeviceOnLogout(token).catch(() => undefined);

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