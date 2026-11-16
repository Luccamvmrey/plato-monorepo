import { ChevronRight, QrCode } from "lucide-react";
import type { JamParticipant } from "@/features/jam/hooks/useActiveJam.ts";
import { cn } from "@/lib/utils.ts";
import { JamAvatar } from "./JamAvatar.tsx";

const isSameExercise = (participant: JamParticipant, exerciseId: number | null) =>
    participant.progress.kind === "TRAINING" && participant.progress.exerciseId === exerciseId;

/**
 * A linha de status de um parceiro. O número de séries nunca é cortado: com três parceiros
 * lado a lado, o que some é o nome do exercício, que a sheet mostra inteiro.
 */
const ProgressLine = ({ participant, activeExerciseId }: { participant: JamParticipant; activeExerciseId: number | null }) => {
    const { progress } = participant;

    if (progress.kind === "DONE") return <>Terminou</>;
    if (progress.kind === "IDLE") return <>Parado</>;

    const count = `${progress.setsDone}/${progress.targetSets}`;

    // No mesmo exercício que você, o nome só repetiria o card logo abaixo.
    if (isSameExercise(participant, activeExerciseId)) return <>{count} séries</>;

    return (
        <span className="flex min-w-0">
            <span className="truncate">{progress.exerciseName}</span>
            <span className="shrink-0">&nbsp;· {count}</span>
        </span>
    );
};

/**
 * Faixa fina sob o cabeçalho da sessão: onde cada parceiro está. Sem rolagem: os parceiros
 * (no máximo três) dividem a largura, e o toque em qualquer ponto abre a sheet da jam.
 */
export const JamStrip = ({ others, activeExerciseId, onOpen }: {
    others: JamParticipant[];
    activeExerciseId: number | null;
    onOpen: () => void;
}) => (
    <button
        type="button"
        onClick={onOpen}
        aria-label="Abrir a jam"
        className="flex items-center gap-2 w-full rounded-xl bg-card border border-border pl-3 pr-2 py-2 text-left"
    >
        {others.length === 0 ? (
            <span className="flex-1 min-w-0 flex items-center gap-2.5">
                <span className="size-8 shrink-0 rounded-full bg-muted flex items-center justify-center">
                    <QrCode className="size-4 text-muted-foreground" aria-hidden />
                </span>
                <span className="min-w-0">
                    <span className="block text-[13px] font-medium">Jam aberta</span>
                    <span className="block text-[12px] text-muted-foreground truncate">Mostre o QR para chamar alguém</span>
                </span>
            </span>
        ) : (
            <span
                className={cn(
                    "flex-1 min-w-0 grid gap-3",
                    others.length === 1 && "grid-cols-1",
                    others.length === 2 && "grid-cols-2",
                    others.length >= 3 && "grid-cols-3 gap-2"
                )}
            >
                {others.map((participant) => (
                    <span key={participant.userId} className="flex items-center gap-2 min-w-0">
                        <JamAvatar
                            name={participant.name}
                            isHighlighted={isSameExercise(participant, activeExerciseId)}
                            className={cn("text-[13px]", others.length >= 3 ? "size-7" : "size-8")}
                        />
                        <span className="min-w-0 flex-1">
                            <span className="block text-[13px] font-medium truncate">{participant.name}</span>
                            <span className="block text-[12px] text-muted-foreground tabular-nums">
                                <ProgressLine participant={participant} activeExerciseId={activeExerciseId} />
                            </span>
                        </span>
                    </span>
                ))}
            </span>
        )}
        <ChevronRight className="size-4 text-muted-foreground shrink-0" aria-hidden />
    </button>
);
