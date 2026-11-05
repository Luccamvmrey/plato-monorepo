// Carregado pelo service worker gerado pelo Workbox (`importScripts` em vite.config.ts).

const FALLBACK = { title: "Plato", body: "Abra o app para ver as novidades", url: "/workouts" };

const parseMessage = (event) => {
    try {
        return { ...FALLBACK, ...event.data.json() };
    } catch {
        return FALLBACK;
    }
};

self.addEventListener("push", (event) => {
    const { title, body, url } = parseMessage(event);

    // Sempre mostra algo: o iOS cancela a inscrição de quem recebe push sem exibir nada.
    event.waitUntil(
        self.registration.showNotification(title, {
            body,
            icon: "/pwa-192x192.png",
            badge: "/pwa-64x64.png",
            data: { url },
        })
    );
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
