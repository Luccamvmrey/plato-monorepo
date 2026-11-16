import { ChevronRight, QrCode } from "lucide-react";
import type { JamParticipant } from "@/features/jam/hooks/useActiveJam.ts";
import { JamAvatar } from "./JamAvatar.tsx";
import { describeJamProgress } from "@/features/jam/utils/jam-progress.ts";

const isSameExercise = (participant: JamParticipant, exerciseId: number | null) =>
    participant.progress.kind === "TRAINING" && participant.progress.exerciseId === exerciseId;

/**
 * Faixa fina sob o cabeçalho da sessão: onde cada parceiro está. O resto da jam (QR, modo,
 * sair) fica na sheet, para a faixa não disputar atenção com o card da série.
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
        className="flex items-center gap-3 w-full rounded-xl bg-card border border-border pl-3 pr-2 py-2 text-left"
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
            <span className="flex-1 min-w-0 flex items-center gap-4 overflow-x-auto [scrollbar-width:none] p-1 -m-1">
                {others.map((participant) => (
                    <span key={participant.userId} className="flex items-center gap-2 shrink-0 max-w-[180px]">
                        <JamAvatar
                            name={participant.name}
                            isHighlighted={isSameExercise(participant, activeExerciseId)}
                            className="size-8 text-[13px]"
                        />
                        <span className="min-w-0">
                            <span className="block text-[13px] font-medium truncate">{participant.name}</span>
                            <span className="block text-[12px] text-muted-foreground truncate tabular-nums">
                                {describeJamProgress(participant.progress, activeExerciseId)}
                            </span>
                        </span>
                    </span>
                ))}
            </span>
        )}
        <ChevronRight className="size-4 text-muted-foreground shrink-0" aria-hidden />
    </button>
);
