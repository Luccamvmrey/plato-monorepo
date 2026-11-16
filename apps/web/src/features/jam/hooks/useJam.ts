import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { JamService } from "@/features/jam/jam.service.ts";
import { readJamStream } from "@/features/jam/utils/jam-stream.ts";

export const jamQueryKey = (jamId: number) => ["jam", jamId];

/**
 * Estado ao vivo da jam. A query é a fonte da verdade; o stream só a mantém atualizada,
 * então a tela lê sempre a query e não sabe se o dado veio do GET ou do SSE.
 */
export const useJam = (jamId: number | null | undefined) => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: jamQueryKey(jamId ?? 0),
        queryFn: () => JamService.getState(jamId!),
        enabled: !!jamId,
    });

    useEffect(() => {
        if (!jamId) return;

        const controller = new AbortController();

        void readJamStream(
            jamId,
            (state) => queryClient.setQueryData(jamQueryKey(jamId), state),
            controller.signal
        );

        return () => controller.abort();
    }, [jamId, queryClient]);

    return query;
};
