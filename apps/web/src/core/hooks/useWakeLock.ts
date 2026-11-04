import { useEffect } from "react";

/**
 * Mantém a tela ligada enquanto `active` for verdadeiro.
 *
 * O sistema solta o bloqueio sempre que o app sai de vista, então ele é pedido de novo
 * ao voltar. Sem suporte ou sem permissão, o app só segue com o comportamento normal.
 */
export const useWakeLock = (active: boolean) => {
    useEffect(() => {
        if (!active || !("wakeLock" in navigator)) return;

        let sentinel: WakeLockSentinel | null = null;
        let released = false;

        const acquire = async () => {
            if (document.visibilityState !== "visible") return;

            try {
                const lock = await navigator.wakeLock.request("screen");

                if (released) {
                    void lock.release();
                    return;
                }
                sentinel = lock;
            } catch {
                // Bateria baixa ou política do navegador: não é um erro para o usuário.
            }
        };

        void acquire();
        document.addEventListener("visibilitychange", acquire);

        return () => {
            released = true;
            document.removeEventListener("visibilitychange", acquire);
            void sentinel?.release();
        };
    }, [active]);
};
