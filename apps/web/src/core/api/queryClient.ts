import { QueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/auth.store.ts";

export const queryClient = new QueryClient();

// Ao sair da conta, por qualquer caminho, os dados do usuário não podem continuar em
// memória: quem entrar em seguida no mesmo aparelho veria o cache da conta anterior.
useAuthStore.subscribe((state, previous) => {
    if (previous.token && !state.token) {
        queryClient.clear();
    }
});
