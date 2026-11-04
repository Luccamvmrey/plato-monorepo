import { useLocation } from "wouter";
import { ChevronRight } from "lucide-react";
import { path } from "@/core/constants/path.ts";
import { formatTime } from "@/core/utils/time.ts";
import { useActiveSession } from "@/features/workouts/hooks/useActiveSession.ts";
import { useWorkoutTimer } from "@/features/workouts/hooks/useWorkoutTimer.ts";

/**
 * Lembra que há um treino aberto em qualquer tela fora da sessão.
 *
 * Substitui um alerta modal que abria a cada troca de aba, com "Descartar" a um toque:
 * olhar o histórico entre duas séries não pode pôr o treino em risco. Descartar agora
 * só acontece dentro da própria sessão.
 */
export const ActiveSessionBanner = () => {
    const [location, navigate] = useLocation();
    const { findActiveSessionQuery } = useActiveSession();

    const session = findActiveSessionQuery.data?.activeSession;
    const { elapsedSeconds } = useWorkoutTimer(session?.startedAt);

    if (!session || location.startsWith(path.ACTIVE_WORKOUT)) return null;

    return (
        <button
            type="button"
            onClick={() => navigate(`${path.ACTIVE_WORKOUT}/${session.workoutId}`)}
            aria-label={`Voltar para o treino em andamento: ${session.workout?.name ?? "treino"}`}
            className="sticky top-0 z-40 w-full flex items-center gap-2 min-h-11 px-4 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-2 bg-card border-b border-border text-left"
        >
            <span className="size-2 rounded-full bg-primary animate-pulse shrink-0" aria-hidden />
            <span className="flex-1 min-w-0 text-[13px] truncate">
                <span className="font-medium">{session.workout?.name ?? "Treino em andamento"}</span>
                <span className="text-muted-foreground tabular-nums"> · {formatTime(elapsedSeconds)}</span>
            </span>
            <span className="flex items-center text-[13px] font-medium text-primary shrink-0">
                Voltar
                <ChevronRight className="size-4" aria-hidden />
            </span>
        </button>
    );
};
