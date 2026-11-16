import { useEffect, useMemo, useState } from "react";
import { isToday } from "date-fns";
import type { Workout, WorkoutSession } from "@/features/workouts/workout.types.ts";
import type { SummaryStats } from "@/features/workouts/hooks/useWorkoutSummaryStats";
import type { StreakData } from "@/features/user/hooks/useStreakData";
import type { JamSummary } from "@plato/shared";
import { buildSummaryLead, buildSummaryMetrics } from "@/features/workouts/utils/summary-headline";
import {
    buildSessionShareData,
    renderSessionShareImage,
    type SessionShareData,
} from "@/features/workouts/utils/session-share-image";
import { formatDateShort } from "@/core/utils/formatters";

type Input = {
    workoutSession: WorkoutSession | undefined;
    workout: Workout | undefined;
    stats: SummaryStats | null;
    streak: StreakData | undefined;
    jam: JamSummary | null;
};

const downloadFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    link.click();
    // O clique dispara o download de forma síncrona; liberar depois de um tique basta.
    setTimeout(() => URL.revokeObjectURL(url), 0);
};

/**
 * Imagem do resumo para mandar no Instagram, no WhatsApp e afins.
 *
 * A imagem é gerada quando a tela abre, não no toque. O iOS só abre a folha nativa a partir
 * de um gesto, e o gesto expira se houver espera no meio: gerando no toque, a folha não
 * abriria. Pelo mesmo motivo de `useShareLink`.
 */
export const useShareSessionResult = ({ workoutSession, workout, stats, streak, jam }: Input) => {
    const data = useMemo<SessionShareData | null>(() => {
        if (!workoutSession?.completedAt || !workout || !stats) return null;

        return buildSessionShareData({
            workoutName: workout.name,
            dateLabel: formatDateShort(workoutSession.completedAt),
            lead: buildSummaryLead(stats, workoutSession.trackingMode),
            metrics: buildSummaryMetrics(stats),
            newPRs: stats.newPRs,
            streakDays: isToday(new Date(workoutSession.completedAt)) ? (streak?.currentStreak ?? null) : null,
            jam,
        });
    }, [workoutSession, workout, stats, streak, jam]);

    // Guardado junto com o `data` que o gerou: um arquivo de dados antigos não serve.
    const [rendered, setRendered] = useState<{ source: SessionShareData; file: File } | null>(null);

    useEffect(() => {
        if (!data) return;

        let cancelled = false;

        renderSessionShareImage(data)
            .then((blob) => {
                if (cancelled) return;

                const fileName = `plato-${workoutSession?.id ?? "treino"}.png`;
                setRendered({ source: data, file: new File([blob], fileName, { type: "image/png" }) });
            })
            .catch(() => undefined);

        return () => {
            cancelled = true;
        };
    }, [data, workoutSession?.id]);

    const file = rendered && rendered.source === data ? rendered.file : null;

    const handleShare = async () => {
        if (!file) return;

        const canShareFile = typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });

        // Desktop e navegador sem compartilhamento de arquivo: baixa a imagem.
        if (!canShareFile) {
            downloadFile(file);
            return;
        }

        try {
            // Só o arquivo, sem texto: com texto junto, o Instagram descarta a imagem em
            // alguns aparelhos e o WhatsApp manda duas mensagens.
            await navigator.share({ files: [file] });
        } catch (error) {
            // Fechar a folha nativa também rejeita, e não é erro de ninguém.
            if (error instanceof DOMException && error.name === "AbortError") return;

            downloadFile(file);
        }
    };

    return {
        isReady: file !== null,
        handleShare,
    };
};
