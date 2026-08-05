import { cn } from "@/lib/utils.ts";
import type { WeekDay } from "@/features/user/hooks/useStreakData.ts";

/**
 * Marcador de um dia da semana na sequência de treinos.
 *
 * Existia duas vezes com linguagens visuais diferentes — emoji ⬜/🔥 no StreakCard e
 * bolinhas com `bg-orange-400` cru no StreakWidget. Emoji ignoram o tema (o ⬜ é o
 * elemento de maior contraste da tela, puxando o olho justamente para os dias em que
 * o usuário NÃO treinou) e renderizam diferente em cada plataforma.
 */
const STATUS_STYLES: Record<WeekDay["status"], string> = {
    // Âmbar = conquista, mesma semântica de PR usada no resto do app
    trained: "bg-pr border-pr",
    // Consumido, mas intencional — presente sem competir com o dia treinado
    rest_used: "bg-muted-foreground/30 border-muted-foreground/30",
    // Ainda não aconteceu — só um contorno
    future: "bg-muted border-border",
};

const STATUS_LABELS: Record<WeekDay["status"], string> = {
    trained: "treinou",
    rest_used: "dia livre usado",
    future: "ainda não",
};

const SIZES = {
    sm: "size-2",
    md: "size-3.5",
} as const;

type StreakDayMarkerProps = {
    status: WeekDay["status"];
    size?: keyof typeof SIZES;
    label?: string;
};

export const StreakDayMarker = ({ status, size = "sm", label }: StreakDayMarkerProps) => (
    <span
        role="img"
        aria-label={label ? `${label}: ${STATUS_LABELS[status]}` : STATUS_LABELS[status]}
        className={cn("rounded-full border transition-colors", SIZES[size], STATUS_STYLES[status])}
    />
);

export default StreakDayMarker;
