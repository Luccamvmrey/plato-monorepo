// Carregado pelo service worker gerado pelo Workbox (`importScripts` em vite.config.ts).

const FALLBACK = { title: "Plato", body: "Abra o app para ver as novidades", url: "/workouts" };

const parseMessage = (event) => {
    try {
        return { ...FALLBACK, ...event.data.json() };
    } catch {
        return FALLBACK;
    }
};

// Provisório, enquanto o aviso de descanso é só para admin: mostra o atraso real de entrega.
const withDelay = (body, measureFrom) =>
    measureFrom ? `${body} (atraso de ${((Date.now() - measureFrom) / 1000).toFixed(1)}s)` : body;

const hasVisibleWindow = async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    return windows.some((client) => client.visibilityState === "visible");
};

const show = async ({ title, body, url, tag, measureFrom, quietWhenVisible }) => {
    // Quem está com a tela aberta já viu o aviso no app (a vez na jam): repetir seria ruído.
    const isQuiet = quietWhenVisible === true && (await hasVisibleWindow());

    // Sempre mostra algo: o iOS cancela a inscrição de quem recebe push sem exibir nada.
    // Quieta, a notificação sai sem som e fecha logo em seguida.
    await self.registration.showNotification(title, {
        body: withDelay(body, measureFrom),
        icon: "/pwa-192x192.png",
        badge: "/pwa-64x64.png",
        data: { url },
        ...(isQuiet
            ? { tag, silent: true }
            // `renotify` faz a notificação que substitui outra alertar de novo, em vez de vir muda.
            : tag ? { tag, renotify: true, vibrate: [200, 100, 200] } : {}),
    });

    // Sem etiqueta não há como achar só esta: melhor deixar aberta do que fechar as outras.
    if (!isQuiet || !tag) return;

    const shown = await self.registration.getNotifications({ tag });
    for (const notification of shown) notification.close();
};

self.addEventListener("push", (event) => {
    event.waitUntil(show(parseMessage(event)));
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const target = new URL(event.notification.data?.url ?? FALLBACK.url, self.location.origin);
    const url = target.origin === self.location.origin ? target.href : new URL(FALLBACK.url, self.location.origin).href;

    event.waitUntil(
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (windows) => {
            const open = windows.find((client) => new URL(client.url).origin === self.location.origin);

            if (!open) return self.clients.openWindow(url);

            const focused = await open.focus();

            // O `navigate` pode falhar em janela não controlada: abrir outra ainda leva à tela certa.
            return focused.navigate(url).catch(() => self.clients.openWindow(url));
        })
    );
});
