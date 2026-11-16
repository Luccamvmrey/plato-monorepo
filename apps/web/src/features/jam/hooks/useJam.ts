import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/auth.store.ts";
import { isAxiosError } from "axios";
import { JamService } from "@/features/jam/jam.service.ts";
import { readJamStream } from "@/features/jam/utils/jam-stream.ts";

export const jamQueryKey = (jamId: number) => ["jam", jamId];

/**
 * Estado ao vivo da jam. A query é a fonte da verdade; o stream só a mantém atualizada,
 * então a tela lê sempre a query e não sabe se o dado veio do GET ou do SSE.
 */
export const useJam = (jamId: number | null | undefined) => {
    const queryClient = useQueryClient();
    const currentUserId = useAuthStore((state) => state.user?.id);

    const query = useQuery({
        queryKey: jamQueryKey(jamId ?? 0),
        queryFn: () => JamService.getState(jamId!),
        enabled: !!jamId,
        // 403 é quem saiu da jam e 404 é jam que sumiu: respostas definitivas.
        retry: (failureCount, error) =>
            !(isAxiosError(error) && [403, 404].includes(error.response?.status ?? 0)) && failureCount < 2,
    });

    // Jam encerrada ou que a pessoa deixou não muda mais para ela: o stream fecha.
    const me = query.data?.members.find((member) => member.userId === currentUserId);
    const isLive = !!jamId && !!query.data && !query.data.endedAt && !me?.leftAt;

    useEffect(() => {
        if (!jamId || !isLive) return;

        const controller = new AbortController();

        void readJamStream(
            jamId,
            (state) => queryClient.setQueryData(jamQueryKey(jamId), state),
            controller.signal
        );

        return () => controller.abort();
    }, [jamId, isLive, queryClient]);

    return query;
};
