import { ChevronRight } from "lucide-react";
import type { WorkoutSession } from "@/features/workouts/workout.types";
import { MuscleBadge } from "@/core/components/MuscleBadge";
import { cn } from "@/lib/utils";
import { useSessionHistoryCardLogic } from "@/features/workouts/hooks/useSessionHistoryCardLogic";
import { formatDateFull } from "@/core/utils/formatters";
import { formatDurationExtensive } from "@/core/utils/time";
import { UNITS } from "@/core/constants/units";

interface SessionHistoryCardProps {
    session: WorkoutSession;
    allRecords?: { exerciseId: number; date: string | Date }[];
    navigate: (path: string) => void;
}

export const SessionHistoryCard = ({ session, allRecords, navigate }: SessionHistoryCardProps) => {
    const {
        workoutName,
        isArchived,
        totalVolume,
        avgRpe,
        completedAt,
        duration,
        totalSets,
        exerciseCount,
        exercises,
        handleExerciseClick,
    } = useSessionHistoryCardLogic(session, allRecords, navigate);

    return (
        <div className="bg-card border border-border rounded-xl p-4 mb-3">

            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h3 className="text-[15px] font-medium tracking-[-0.02em] text-foreground">
                        {workoutName}
                        {isArchived && (
                            <span className="text-[10px] ml-2 text-muted-foreground uppercase tracking-[0.04em]">
                                Arquivado
                            </span>
                        )}
                    </h3>
                    <p className="text-[12px] text-muted-foreground mt-0.5">
                        {completedAt ? formatDateFull(completedAt) : "Em progresso"}
                    </p>
                </div>
                {duration !== null && (
                    <span className="text-[12px] text-muted-foreground">
                        {formatDurationExtensive(duration)}
                    </span>
                )}
            </div>

            {/* Métricas */}
            <div className="flex gap-6 mb-3">
                <div>
                    <p className="text-[10px] font-medium tracking-[0.05em] uppercase text-muted-foreground mb-0.5">
                        Volume total
                    </p>
                    <p className="text-[15px] font-medium tracking-[-0.02em] text-foreground">
                        {totalVolume.toLocaleString("pt-BR")} {UNITS.WEIGHT}
                    </p>
                </div>
                <div>
                    <p className="text-[10px] font-medium tracking-[0.05em] uppercase text-muted-foreground mb-0.5">
                        RPE médio
                    </p>
                    <p className="text-[15px] font-medium tracking-[-0.02em] text-foreground">
                        {avgRpe.toFixed(1)}
                    </p>
                </div>
            </div>

            {/* Pills de contagem */}
            <div className="flex gap-2 mb-3">
                <span className="text-[11px] text-muted-foreground bg-muted rounded-full px-2.5 py-0.5">
                    {totalSets} {totalSets === 1 ? UNITS.SINGLE_SET : UNITS.SETS}
                </span>
                <span className="text-[11px] text-muted-foreground bg-muted rounded-full px-2.5 py-0.5">
                    {exerciseCount} {exerciseCount === 1 ? UNITS.SINGLE_EXERCISE : UNITS.EXERCISES}
                </span>
            </div>

            {/* Divisor */}
            <div className="border-t border-border mb-3" />

            {/* Lista de exercícios */}
            <p className="text-[10px] font-medium tracking-[0.05em] uppercase text-muted-foreground mb-2">
                Exercícios realizados
            </p>
            {exercises.map((ex, i) => (
                <button
                    key={ex.id}
                    onClick={() => handleExerciseClick(ex.id)}
                    className={cn(
                        "flex items-center gap-2 w-full py-2 text-left hover:opacity-80 transition-opacity",
                        i < exercises.length - 1 && "border-b border-border"
                    )}
                >
                    <span className="text-[13px] text-foreground flex-1 min-w-0 truncate">
                        {ex.name}
                    </span>
                    {ex.muscleGroup && <MuscleBadge muscle={ex.muscleGroup} />}
                    {ex.hasPr && <span className="badge-pr">PR</span>}
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 ml-1" />
                </button>
            ))}
        </div>
    );
};
