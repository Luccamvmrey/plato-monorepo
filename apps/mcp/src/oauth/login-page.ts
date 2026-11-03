const escapeHtml = (value: string) =>
    value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

const STYLE = `
    :root { color-scheme: light dark; --bg: #f5f5f4; --card: #fff; --text: #1c1917; --muted: #78716c; --border: #e7e5e4; --accent: #1c1917; --accent-text: #fff; --error: #b91c1c; }
    @media (prefers-color-scheme: dark) { :root { --bg: #0c0a09; --card: #1c1917; --text: #f5f5f4; --muted: #a8a29e; --border: #292524; --accent: #f5f5f4; --accent-text: #1c1917; --error: #f87171; } }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 16px; background: var(--bg); color: var(--text); font: 16px/1.5 system-ui, sans-serif; }
    main { width: 100%; max-width: 360px; background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 28px 24px; }
    h1 { margin: 0 0 4px; font-size: 22px; }
    p { margin: 0 0 20px; color: var(--muted); font-size: 14px; }
    label { display: block; margin-bottom: 14px; font-size: 14px; font-weight: 500; }
    input { display: block; width: 100%; margin-top: 6px; padding: 12px; font: inherit; color: inherit; background: transparent; border: 1px solid var(--border); border-radius: 10px; }
    button { width: 100%; margin-top: 6px; padding: 12px; font: inherit; font-weight: 600; color: var(--accent-text); background: var(--accent); border: 0; border-radius: 10px; cursor: pointer; }
    .error { color: var(--error); font-size: 14px; margin: 0 0 14px; }
`;

function page(title: string, body: string): string {
    return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${STYLE}</style>
</head>
<body><main>${body}</main></body>
</html>`;
}

export function renderLoginPage(options: {
    clientName: string | null;
    hiddenParams: URLSearchParams;
    email?: string;
    error?: string;
}): string {
    const hidden = [...options.hiddenParams]
        .map(([name, value]) => `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}">`)
        .join("");
    const client = escapeHtml(options.clientName ?? "Um aplicativo");

    return page(
        "Entrar no Plato",
        `<h1>Entrar no Plato</h1>
<p>${client} quer acessar seus treinos, sessões e recordes.</p>
${options.error ? `<p class="error" role="alert">${escapeHtml(options.error)}</p>` : ""}
<form method="post">
${hidden}
<label>Email<input type="email" name="email" autocomplete="email" required value="${escapeHtml(options.email ?? "")}"></label>
<label>Senha<input type="password" name="password" autocomplete="current-password" required></label>
<button type="submit">Entrar e autorizar</button>
</form>`
    );
}

export function renderErrorPage(message: string): string {
    return page("Erro de autorização", `<h1>Não foi possível autorizar</h1><p>${escapeHtml(message)}</p>`);
}
