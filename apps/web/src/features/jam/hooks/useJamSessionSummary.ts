import { useQuery } from "@tanstack/react-query";
import { buildJamSummary } from "@plato/shared";
import { useAuthStore } from "@/features/auth/auth.store.ts";
import { JamService } from "@/features/jam/jam.service.ts";
import { jamQueryKey, useJam } from "./useJam.ts";

/**
 * O card da jam no resumo da sessão. `useJam` mantém o estado ao vivo (quem ainda treina
 * termina e o card se atualiza); o `select` com compartilhamento estrutural mantém o mesmo
 * objeto enquanto o resumo não muda, então a imagem de compartilhar não é refeita a cada
 * presença que chega.
 */
export const useJamSessionSummary = (jamId: number | null | undefined) => {
    const currentUserId = useAuthStore((state) => state.user?.id);

    useJam(jamId);

    const { data } = useQuery({
        queryKey: jamQueryKey(jamId ?? 0),
        queryFn: () => JamService.getState(jamId!),
        enabled: !!jamId && currentUserId !== undefined,
        select: (state) => buildJamSummary(state, currentUserId!),
    });

    return data ?? null;
};
