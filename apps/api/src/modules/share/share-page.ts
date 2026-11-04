/**
 * O `index.html` do web com as tags de preview do link.
 *
 * Os robôs de preview (WhatsApp e afins) não rodam JavaScript, então o título precisa
 * sair do servidor. Todo mundo recebe a mesma página: a SPA assume em seguida, e nenhum
 * ramo depende de adivinhar quem é robô pelo User-Agent.
 */
export interface SharePageMeta {
    title: string;
    description: string;
    /** Endereço público da página. Ausente no link indisponível. */
    url?: string;
    /** Endereço público da imagem de preview. */
    image: string;
    /** Links de usuários não devem aparecer em buscadores. */
    indexable: boolean;
}

const HTML_ESCAPES: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
};

/** O nome do treino é texto de usuário: sem isto, viraria HTML na página de quem abre. */
export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);

const MAX_DESCRIPTION_LENGTH = 200;

export const clipDescription = (value: string) =>
    value.length > MAX_DESCRIPTION_LENGTH ? `${value.slice(0, MAX_DESCRIPTION_LENGTH - 1).trimEnd()}…` : value;

const metaTag = (attribute: "name" | "property", key: string, value: string) =>
    `<meta ${attribute}="${key}" content="${escapeHtml(value)}" />`;

export const renderSharePage = (html: string, meta: SharePageMeta) => {
    const tags = [
        metaTag("property", "og:type", "website"),
        metaTag("property", "og:site_name", "Plato"),
        metaTag("property", "og:title", meta.title),
        metaTag("property", "og:description", meta.description),
        metaTag("property", "og:image", meta.image),
        ...(meta.url ? [metaTag("property", "og:url", meta.url)] : []),
        metaTag("name", "twitter:card", "summary"),
        ...(meta.indexable ? [] : [metaTag("name", "robots", "noindex")]),
    ].join("\n    ");

    // Substituição por função, não por texto: em texto, um "$&" no nome do treino seria
    // interpretado pelo `replace` e colaria o trecho casado de volta na página.
    return html
        .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${escapeHtml(meta.title)}</title>`)
        .replace(/<meta name="description"[^>]*>/, () => metaTag("name", "description", meta.description))
        .replace("</head>", () => `    ${tags}\n  </head>`);
};
