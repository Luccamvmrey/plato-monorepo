import { describe, expect, it } from "vitest";
import { clipDescription, escapeHtml, renderSharePage } from "./share-page";

const INDEX_HTML = `<!doctype html>
<html>
  <head>
    <meta name="description" content="Descrição padrão." />
    <title>Plato</title>
  </head>
  <body><div id="root"></div></body>
</html>`;

const META = {
    title: "Treino A",
    description: "Treino no Plato",
    url: "https://plato-work-out.com/s/abc",
    image: "https://plato-work-out.com/pwa-512x512.png",
    indexable: false,
};

describe("escapeHtml", () => {
    it("escapa todos os caracteres que abrem HTML ou atributo", () => {
        expect(escapeHtml(`<a href="x" id='y'>&`)).toBe("&lt;a href=&quot;x&quot; id=&#39;y&#39;&gt;&amp;");
    });
});

describe("renderSharePage", () => {
    it("troca o título e a descrição e injeta as tags de preview", () => {
        const page = renderSharePage(INDEX_HTML, META);

        expect(page).toContain("<title>Treino A</title>");
        expect(page).toContain('<meta name="description" content="Treino no Plato" />');
        expect(page).toContain('<meta property="og:title" content="Treino A" />');
        expect(page).toContain('<meta property="og:url" content="https://plato-work-out.com/s/abc" />');
        expect(page).not.toContain("Descrição padrão.");
        expect(page).not.toContain("<title>Plato</title>");
    });

    it("não deixa o texto do usuário virar HTML", () => {
        const hostile = `"><script>alert(1)</script>`;
        const page = renderSharePage(INDEX_HTML, { ...META, title: hostile, description: hostile });

        expect(page).not.toContain("<script>");
        expect(page).toContain("&lt;script&gt;");
        expect(page).not.toContain('content=""><');
    });

    it("não interpreta padrões de substituição no nome do treino", () => {
        const page = renderSharePage(INDEX_HTML, { ...META, title: "Treino $& $' $`" });

        expect(page).toContain("<title>Treino $&amp; $&#39; $`</title>");
        expect(page.match(/<\/head>/g)).toHaveLength(1);
    });

    it("marca noindex só em link que não pode ser indexado", () => {
        expect(renderSharePage(INDEX_HTML, META)).toContain('<meta name="robots" content="noindex" />');
        expect(renderSharePage(INDEX_HTML, { ...META, indexable: true })).not.toContain("noindex");
    });

    it("omite og:url quando o link não está disponível", () => {
        expect(renderSharePage(INDEX_HTML, { ...META, url: undefined })).not.toContain("og:url");
    });
});

describe("clipDescription", () => {
    it("mantém texto curto e corta o longo em até 200 caracteres", () => {
        expect(clipDescription("curto")).toBe("curto");

        const clipped = clipDescription("a".repeat(300));

        expect(clipped).toHaveLength(200);
        expect(clipped.endsWith("…")).toBe(true);
    });
});
