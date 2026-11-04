import { useAuthStore } from "@/features/auth/auth.store.ts";
import { useEffect } from "react";
import { AuthService } from "@/features/auth/auth.service.ts";
import { shouldRenewToken } from "@/features/auth/token.ts";

export const useCheckSession = () => {
    const checkSession = useAuthStore((state) => state.checkSession);

    const setToken = useAuthStore((state) => state.setToken);

    useEffect(() => {
        checkSession();

        // Renova ao abrir o app, longe do treino: quem usa toda semana nunca chega a
        // ver o token expirar. Se falhar, o token atual segue válido até o `exp`.
        const { token } = useAuthStore.getState();
        if (token && shouldRenewToken(token)) {
            AuthService.refresh().then(setToken).catch(() => undefined);
        }
    }, [checkSession, setToken]);
}