import { useState } from "react";
import { ChevronDown, ChevronRight, Trophy } from "lucide-react";
import type { WorkoutSession } from "@/features/workouts/workout.types";
import DeviationBadge from "@/features/workouts/components/DeviationBadge";
import { cn } from "@/lib/utils";
import { useSessionHistoryCardLogic } from "@/features/workouts/hooks/useSessionHistoryCardLogic";
import { formatDateShort } from "@/core/utils/formatters";
import { formatDurationExtensive } from "@/core/utils/time";
import { UNITS } from "@/core/constants/units";

interface SessionHistoryCardProps {
    session: WorkoutSession;
    sessionPrMap: Map<number, Set<number>>;
    navigate: (path: string) => void;
}

/** Fechado responde "o que fiz e como foi". Abrir é o caminho para cada exercício. */
export const SessionHistoryCard = ({ session, sessionPrMap, navigate }: SessionHistoryCardProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const {
        workoutName,
        isArchived,
        isSimple,
        totalVolume,
        avgRpe,
        completedAt,
        duration,
        totalSets,
        prCount,
        exercises,
        unexecuted,
        handleExerciseClick,
    } = useSessionHistoryCardLogic(session, sessionPrMap, navigate);

    const details = [
        `${totalSets} ${totalSets === 1 ? UNITS.SINGLE_SET : UNITS.SETS}`,
        avgRpe > 0 ? `RPE ${avgRpe.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}` : null,
        isSimple ? "modo simples" : null,
    ].filter(Boolean).join(" · ");

    return (
        <div className="bg-card border border-border rounded-xl">
            <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setIsOpen((open) => !open)}
                className="w-full flex flex-col gap-2 p-4 text-left"
            >
                <div className="w-full flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-[15px] font-medium tracking-[-0.02em] text-foreground truncate">
                            {workoutName}
                        </h3>
                        <p className="text-[13px] text-muted-foreground mt-0.5">
                            {completedAt ? formatDateShort(completedAt) : "Em andamento"}
                            {duration > 0 && ` · ${formatDurationExtensive(duration)}`}
                            {isArchived && " · arquivado"}
                        </p>
                    </div>
                    {prCount > 0 && (
                        <span className="badge-pr shrink-0">
                            <Trophy className="size-3" aria-hidden />
                            {prCount} {prCount === 1 ? "PR" : "PRs"}
                        </span>
                    )}
                    <ChevronDown className={cn(
                        "size-4 mt-1 text-muted-foreground shrink-0 transition-transform duration-200",
                        isOpen && "rotate-180"
                    )} />
                </div>

                <p className="flex items-baseline gap-2 min-w-0">
                    {totalVolume > 0 && (
                        <span className="text-[17px] font-semibold tracking-[-0.02em] tabular-nums whitespace-nowrap">
                            {Math.round(totalVolume).toLocaleString("pt-BR")} {UNITS.WEIGHT}
                        </span>
                    )}
                    <span className="text-[13px] text-muted-foreground truncate">{details}</span>
                </p>
            </button>

            {isOpen && (
                <div className="px-4 pb-2 border-t border-border">
                    {exercises.map((ex, i) => (
                        <button
                            key={ex.id}
                            type="button"
                            onClick={() => handleExerciseClick(ex.id)}
                            className={cn(
                                "flex flex-col gap-0.5 w-full min-h-12 py-3 text-left",
                                i < exercises.length - 1 && "border-b border-border"
                            )}
                        >
                            <span className="w-full flex items-center gap-2">
                                <span className="text-[14px] text-foreground flex-1 min-w-0 truncate">{ex.name}</span>
                                {ex.hasPr && (
                                    <Trophy className="size-3.5 text-pr shrink-0" aria-label="Recorde pessoal" />
                                )}
                                {ex.deviation && <DeviationBadge kind={ex.deviation.kind} />}
                                <span className="text-[13px] text-muted-foreground tabular-nums whitespace-nowrap">
                                    {ex.summary}
                                </span>
                                <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
                            </span>
                            {/* Segunda linha, junto da nota: aqui o texto pode ser longo sem
                                disputar largura com o nome do exercício. */}
                            {ex.deviation?.replacedName && (
                                <span className="text-[12px] text-muted-foreground">
                                    no lugar de {ex.deviation.replacedName}
                                </span>
                            )}
                            {ex.note && (
                                <span className="text-[12px] text-muted-foreground italic">{ex.note}</span>
                            )}
                        </button>
                    ))}

                    {/* Prescrito e não executado. Não é clicável: não há análise a abrir sobre
                        um exercício sem série. Só existe em sessão com snapshot — antes dele,
                        uma lista derivada de sessionSet não tinha como saber que existiu. */}
                    {unexecuted.length > 0 && (
                        <div className="py-3 border-t border-border flex flex-col gap-2">
                            {unexecuted.map((ex) => (
                                <div key={`${ex.kind}-${ex.exerciseId}`} className="flex flex-col gap-0.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[14px] text-muted-foreground flex-1 min-w-0 truncate">
                                            {ex.name}
                                        </span>
                                        <DeviationBadge kind={ex.kind} />
                                    </div>
                                    {ex.replacedByName && (
                                        <p className="text-[12px] text-muted-foreground">por {ex.replacedByName}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
