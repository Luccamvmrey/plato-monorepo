import type { SummaryStats } from "@/features/workouts/hooks/useWorkoutSummaryStats";
import type { SummaryLead, SummaryMetric } from "@/features/workouts/utils/summary-headline";
import { formatWeightPtBr } from "@/features/workouts/utils/progression";
import { UNITS } from "@/core/constants/units";

/** O que vai na imagem, já formatado. Montado a partir do resumo, sem nada calculado aqui. */
export type SessionShareData = {
    workoutName: string;
    dateLabel: string;
    lead: SummaryLead | undefined;
    metrics: SummaryMetric[];
    prs: { name: string; value: string }[];
    /** Só quando a sessão é de hoje: a sequência é a de agora, não a do dia do treino. */
    streakDays: number | null;
};

export const buildSessionShareData = (input: {
    workoutName: string;
    dateLabel: string;
    lead: SummaryLead | undefined;
    metrics: SummaryMetric[];
    newPRs: SummaryStats["newPRs"];
    streakDays: number | null;
}): SessionShareData => ({
    workoutName: input.workoutName,
    dateLabel: input.dateLabel,
    lead: input.lead,
    metrics: input.metrics,
    prs: input.newPRs.map((pr) => ({
        name: pr.exerciseName,
        value: `${formatWeightPtBr(pr.newMax)} ${UNITS.WEIGHT}`,
    })),
    streakDays: input.streakDays && input.streakDays > 0 ? input.streakDays : null,
});

// 9:16: o formato de Stories e de status do WhatsApp. Numa conversa também aparece inteiro.
const WIDTH = 1080;
const HEIGHT = 1920;
const PADDING_X = 96;
const CONTENT_WIDTH = WIDTH - PADDING_X * 2;

// O Instagram cobre o topo (perfil) e a base (resposta) do story. O conteúdo fica entre os
// dois, e a marca, logo acima da faixa de baixo.
const SAFE_TOP = 180;
const BRAND_Y = HEIGHT - 260;
const SAFE_BOTTOM = BRAND_Y - 96;

const MAX_PRS = 3;

/**
 * Tokens do tema escuro, em hex: o canvas não lê variáveis CSS, e `oklch()` em `fillStyle`
 * ainda não é garantido em todo Safari. O fundo é o do ícone do app.
 */
const COLOR = {
    background: "#141418",
    foreground: "#f4f5f7",
    muted: "#8f939c",
    border: "rgba(255, 255, 255, 0.08)",
    success: "#22c38a",
    pr: "#f2ad3a",
    prSubtle: "#2a1f0c",
} as const;

const FONT_FAMILY = `"Geist Variable", system-ui, sans-serif`;

const font = (weight: 400 | 500 | 600, size: number) => `${weight} ${size}px ${FONT_FAMILY}`;

type Ctx = CanvasRenderingContext2D;

/** Tracking negativo nos títulos, como na tela. Navegador sem suporte desenha sem. */
const setTracking = (ctx: Ctx, px: number) => {
    if ("letterSpacing" in ctx) ctx.letterSpacing = `${px}px`;
};

const fitText = (ctx: Ctx, text: string, maxWidth: number): string => {
    if (ctx.measureText(text).width <= maxWidth) return text;

    let end = text.length;
    while (end > 0 && ctx.measureText(`${text.slice(0, end).trimEnd()}…`).width > maxWidth) end--;

    return `${text.slice(0, end).trimEnd()}…`;
};

/** Quebra por palavra em até `maxLines` linhas; o que sobra vira reticências na última. */
const wrapText = (ctx: Ctx, text: string, maxWidth: number, maxLines: number): string[] => {
    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let current = "";

    for (let i = 0; i < words.length; i++) {
        const candidate = current ? `${current} ${words[i]}` : words[i];

        if (ctx.measureText(candidate).width <= maxWidth || !current) {
            current = candidate;
            continue;
        }

        if (lines.length === maxLines - 1) {
            return [...lines, fitText(ctx, `${current} ${words.slice(i).join(" ")}`, maxWidth)];
        }

        lines.push(current);
        current = words[i];
    }

    return [...lines, fitText(ctx, current, maxWidth)];
};

const roundedRect = (ctx: Ctx, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
};

/** O ícone do app (`public/icon.svg`): dois anéis e o centro, em escala. */
const drawLogo = (ctx: Ctx, cx: number, cy: number, size: number) => {
    const scale = size / 512;

    ctx.strokeStyle = COLOR.foreground;
    ctx.fillStyle = COLOR.foreground;

    ctx.lineWidth = 44 * scale;
    ctx.beginPath();
    ctx.arc(cx, cy, 168 * scale, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 24 * scale;
    ctx.beginPath();
    ctx.arc(cx, cy, 76 * scale, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 22 * scale, 0, Math.PI * 2);
    ctx.fill();
};

/** Um trecho da imagem: quanto ocupa e como se desenha a partir de um `y`. */
type Block = { height: number; gapBefore: number; draw: (y: number) => void };

const headerBlocks = (ctx: Ctx, data: SessionShareData): Block[] => {
    ctx.font = font(600, 104);
    setTracking(ctx, -3);
    const nameLines = wrapText(ctx, data.workoutName, CONTENT_WIDTH, 2);
    setTracking(ctx, 0);

    return [
        {
            height: 44,
            gapBefore: 0,
            draw: (y) => {
                ctx.font = font(500, 40);
                ctx.fillStyle = COLOR.success;
                ctx.fillText("Treino concluído", PADDING_X, y);
            },
        },
        {
            height: nameLines.length * 112,
            gapBefore: 28,
            draw: (y) => {
                ctx.font = font(600, 104);
                ctx.fillStyle = COLOR.foreground;
                setTracking(ctx, -3);
                nameLines.forEach((line, index) => ctx.fillText(line, PADDING_X, y + index * 112));
                setTracking(ctx, 0);
            },
        },
        {
            height: 44,
            gapBefore: 24,
            draw: (y) => {
                ctx.font = font(400, 40);
                ctx.fillStyle = COLOR.muted;
                const streak = data.streakDays
                    ? `  ·  Sequência de ${data.streakDays} ${data.streakDays === 1 ? "dia" : "dias"}`
                    : "";
                ctx.fillText(data.dateLabel, PADDING_X, y);

                if (streak) {
                    const dateWidth = ctx.measureText(data.dateLabel).width;
                    ctx.fillStyle = COLOR.pr;
                    ctx.fillText(streak, PADDING_X + dateWidth, y);
                }
            },
        },
    ];
};

const leadBlock = (ctx: Ctx, lead: SummaryLead): Block => ({
    height: 44 + 16 + 160,
    gapBefore: 88,
    draw: (y) => {
        ctx.font = font(500, 40);
        ctx.fillStyle = COLOR.muted;
        ctx.fillText(lead.label, PADDING_X, y);

        ctx.font = font(600, 160);
        ctx.fillStyle = COLOR.foreground;
        setTracking(ctx, -6);
        ctx.fillText(fitText(ctx, lead.value, CONTENT_WIDTH), PADDING_X, y + 60);
        setTracking(ctx, 0);
    },
});

const metricsBlock = (ctx: Ctx, metrics: SummaryMetric[], gapBefore: number): Block => ({
    height: 40 + 44 + 72,
    gapBefore,
    draw: (y) => {
        ctx.strokeStyle = COLOR.border;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(PADDING_X, y);
        ctx.lineTo(WIDTH - PADDING_X, y);
        ctx.stroke();

        const columnWidth = CONTENT_WIDTH / metrics.length;

        metrics.forEach((metric, index) => {
            const x = PADDING_X + index * columnWidth;

            ctx.font = font(500, 38);
            ctx.fillStyle = COLOR.muted;
            ctx.fillText(metric.label, x, y + 40);

            ctx.font = font(600, 72);
            ctx.fillStyle = COLOR.foreground;
            setTracking(ctx, -2);
            ctx.fillText(fitText(ctx, metric.value, columnWidth - 24), x, y + 40 + 56);
            setTracking(ctx, 0);
        });
    },
});

const prBlock = (ctx: Ctx, prs: SessionShareData["prs"]): Block => {
    const shown = prs.slice(0, MAX_PRS);
    const hidden = prs.length - shown.length;
    const rowHeight = 68;
    const innerPadding = 56;
    const titleHeight = 52;
    const rowsHeight = shown.length * rowHeight + (hidden > 0 ? rowHeight : 0);
    const height = innerPadding * 2 + titleHeight + 28 + rowsHeight - (rowHeight - 44);

    return {
        height,
        gapBefore: 64,
        draw: (y) => {
            ctx.fillStyle = COLOR.prSubtle;
            roundedRect(ctx, PADDING_X, y, CONTENT_WIDTH, height, 40);
            ctx.fill();

            const x = PADDING_X + innerPadding;
            const innerWidth = CONTENT_WIDTH - innerPadding * 2;
            let cursor = y + innerPadding;

            ctx.font = font(600, 48);
            ctx.fillStyle = COLOR.pr;
            setTracking(ctx, -1);
            ctx.fillText(prs.length === 1 ? "Novo recorde pessoal" : `${prs.length} novos recordes`, x, cursor);
            setTracking(ctx, 0);
            cursor += titleHeight + 28;

            shown.forEach((pr) => {
                ctx.font = font(600, 44);
                const valueWidth = ctx.measureText(pr.value).width;
                ctx.fillStyle = COLOR.pr;
                ctx.textAlign = "right";
                ctx.fillText(pr.value, x + innerWidth, cursor);
                ctx.textAlign = "left";

                ctx.font = font(400, 44);
                ctx.fillStyle = COLOR.foreground;
                ctx.fillText(fitText(ctx, pr.name, innerWidth - valueWidth - 40), x, cursor);
                cursor += rowHeight;
            });

            if (hidden > 0) {
                ctx.font = font(400, 40);
                ctx.fillStyle = COLOR.muted;
                ctx.fillText(`e mais ${hidden} ${hidden === 1 ? "recorde" : "recordes"}`, x, cursor);
            }
        },
    };
};

const drawBrand = (ctx: Ctx) => {
    const logoSize = 72;
    ctx.font = font(600, 48);
    setTracking(ctx, -1);
    const wordWidth = ctx.measureText("Plato").width;
    const gap = 20;
    const startX = (WIDTH - (logoSize + gap + wordWidth)) / 2;

    drawLogo(ctx, startX + logoSize / 2, BRAND_Y, logoSize);

    ctx.fillStyle = COLOR.foreground;
    ctx.textBaseline = "middle";
    ctx.fillText("Plato", startX + logoSize + gap, BRAND_Y + 2);
    setTracking(ctx, 0);

    ctx.font = font(400, 34);
    ctx.fillStyle = COLOR.muted;
    ctx.textAlign = "center";
    ctx.fillText("plato-work-out.com", WIDTH / 2, BRAND_Y + 76);
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
};

/**
 * Sem esperar a fonte, o canvas desenha na fonte do sistema: o `@font-face` da Geist só
 * baixa quando alguma coisa na tela pede aquele peso.
 */
const loadFonts = async () => {
    if (!document.fonts) return;

    await Promise.all([400, 500, 600].map((weight) => document.fonts.load(font(weight as 400 | 500 | 600, 40))))
        .catch(() => undefined);
};

/** Desenha a imagem de compartilhar do resumo da sessão e devolve o PNG. */
export const renderSessionShareImage = async (data: SessionShareData): Promise<Blob> => {
    await loadFonts();

    const canvas = document.createElement("canvas");
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D indisponível");

    ctx.fillStyle = COLOR.background;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.textBaseline = "top";
    ctx.textAlign = "left";

    const blocks: Block[] = [
        ...headerBlocks(ctx, data),
        ...(data.lead ? [leadBlock(ctx, data.lead)] : []),
        metricsBlock(ctx, data.metrics, data.lead ? 56 : 120),
        ...(data.prs.length > 0 ? [prBlock(ctx, data.prs)] : []),
    ];

    // Centralizado na faixa segura: com ou sem recordes, o treino fica no meio do story.
    const totalHeight = blocks.reduce((sum, block) => sum + block.gapBefore + block.height, 0);
    let y = SAFE_TOP + Math.max(0, (SAFE_BOTTOM - SAFE_TOP - totalHeight) / 2);

    blocks.forEach((block) => {
        y += block.gapBefore;
        block.draw(y);
        y += block.height;
    });

    drawBrand(ctx);

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Falha ao gerar a imagem"))), "image/png");
    });
};
