import { API_BASE_URL } from "@/core/api/base-url.ts";
import { useAuthStore } from "@/features/auth/auth.store.ts";
import type { JamState } from "@/features/jam/jam.types.ts";

const RETRY_DELAYS_MS = [1_000, 2_000, 5_000, 10_000];

const wait = (ms: number, signal: AbortSignal) =>
    new Promise<void>((resolve) => {
        const timeout = setTimeout(resolve, ms);
        signal.addEventListener("abort", () => {
            clearTimeout(timeout);
            resolve();
        }, { once: true });
    });

/** Status que não se resolve tentando de novo: jam inexistente, sem acesso, sem login. */
const isFinalStatus = (status: number) => status === 401 || status === 403 || status === 404;

/**
 * Lê o stream SSE da jam e chama `onState` a cada estado novo, reconectando sozinho quando
 * a conexão cai (rede da academia, app em segundo plano). Termina quando `signal` aborta.
 *
 * `fetch` em vez de `EventSource` porque este manda o JWT no cabeçalho; token na URL
 * ficaria nos logs do Nginx e da Cloudflare.
 */
export const readJamStream = async (jamId: number, onState: (state: JamState) => void, signal: AbortSignal) => {
    let attempt = 0;

    while (!signal.aborted) {
        try {
            const token = useAuthStore.getState().token;
            const response = await fetch(`${API_BASE_URL}/jams/${jamId}/stream`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                signal,
            });

            if (isFinalStatus(response.status)) return;
            if (!response.ok || !response.body) throw new Error(`Jam stream ${response.status}`);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            for (;;) {
                const { value, done } = await reader.read();
                if (done) break;

                attempt = 0;
                buffer += decoder.decode(value, { stream: true });

                let boundary = buffer.indexOf("\n\n");
                while (boundary >= 0) {
                    const event = buffer.slice(0, boundary);
                    buffer = buffer.slice(boundary + 2);

                    // Linhas com ":" no começo são o heartbeat do servidor.
                    if (event.startsWith("data: ")) onState(JSON.parse(event.slice(6)) as JamState);

                    boundary = buffer.indexOf("\n\n");
                }
            }
        } catch {
            if (signal.aborted) return;
        }

        await wait(RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)], signal);
        attempt++;
    }
};
