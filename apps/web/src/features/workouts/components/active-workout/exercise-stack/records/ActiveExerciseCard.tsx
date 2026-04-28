import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoreHorizontal, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { useActiveExerciseCardLogic } from "@/features/workouts/hooks/useActiveExerciseCardLogic.ts";
import { useActiveSetInput } from "@/features/workouts/hooks/useActiveSetInput.ts";
import { MuscleBadge } from "@/core/components/MuscleBadge";
import { CompletedSetRow } from "./CompletedSetRow";
import { PendingSetRow } from "./PendingSetRow";
import { RpeSelector } from "../../components/RpeSelector";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { EnrichedExerciseRecord, WorkoutSession } from "@/features/workouts/workout.types.ts";

type ActiveExerciseCardProps = {
    record: EnrichedExerciseRecord;
    sessionId: number;
    isReadOnly?: boolean;
    onHeaderClick?: () => void;
    lastSession?: WorkoutSession | null;
};

const ActiveExerciseCard = ({ record, sessionId, isReadOnly = false, onHeaderClick, lastSession }: ActiveExerciseCardProps) => {
    const {
        showEquipmentWeight,
        toggleEquipmentWeight,
        suggestions,
        activeSetNumber,
        pendingSetsCount,
        handleSetConfirm,
        isPending,
    } = useActiveExerciseCardLogic(record, sessionId, lastSession, isReadOnly);

    const { state, actions } = useActiveSetInput({
        setNumber: activeSetNumber,
        targetReps: record.targetReps,
        previousWeight: suggestions.weight,
        previousEquipmentWeight: suggestions.equipWeight,
        onConfirm: (data) => handleSetConfirm(activeSetNumber, data),
        isPending,
    });

    const weightRef = useRef<HTMLInputElement>(null);
    const repsRef = useRef<HTMLInputElement>(null);

    const { weight, reps, rpe, equipmentWeight, wasSubmitted } = state;
    const { setWeight, setReps, setRpe, setEquipmentWeight, handleConfirm } = actions;

    const handleFocusScroll = (ref: React.RefObject<HTMLInputElement | null>) => {
        setTimeout(() => {
            ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 300);
    };

    const doneDots = record.logs.length;
    const totalDots = record.targetSets;
    const activeDot = isReadOnly ? -1 : doneDots;

    if (isReadOnly) {
        return (
            <div
                className={cn(
                    "flex flex-col gap-2 p-4 rounded-xl bg-card border border-border",
                    onHeaderClick && "cursor-pointer hover:bg-muted/20 transition-colors"
                )}
                onClick={onHeaderClick}
            >
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-success flex-shrink-0" />
                    <span className="text-[13px] font-medium text-muted-foreground flex-1">
                        {record.exercise.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                        {record.logs.length} / {record.targetSets} séries
                    </span>
                </div>
                <div className="flex flex-col gap-1.5">
                    {record.logs.map(log => (
                        <div key={log.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-success-subtle">
                            <span className="text-[13px] font-medium text-success-subtle-fg">
                                Set {log.setNumber}
                            </span>
                            <span className="ml-auto text-[12px] text-success-subtle-fg/70 tabular-nums">
                                {log.actualWeight}kg · {log.actualReps}rep · RPE {log.rpe}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <motion.div layout className="flex flex-col gap-2">
            <AnimatePresence>
                {record.logs.map(log => (
                    <CompletedSetRow key={log.id} log={log} />
                ))}
            </AnimatePresence>

            <motion.div
                layout
                className="border-2 border-primary/40 rounded-xl bg-card p-4 flex flex-col gap-4"
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-base font-medium tracking-[-0.02em] text-foreground">
                            {record.exercise.name}
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-[12px] text-muted-foreground">Padrão</span>
                            <MuscleBadge muscle={record.exercise.targetMuscle} />
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="text-muted-foreground p-1 hover:text-foreground transition-colors flex-shrink-0 mt-0.5">
                                <MoreHorizontal className="size-5" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={toggleEquipmentWeight}>
                                {showEquipmentWeight ? "Remover Barra" : "Adicionar Barra"}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Progress dots */}
                <div className="flex items-center gap-2">
                    {Array.from({ length: totalDots }).map((_, idx) => (
                        <div
                            key={idx}
                            className={cn(
                                "w-2 h-2 rounded-full transition-colors",
                                idx < doneDots
                                    ? "bg-success"
                                    : idx === activeDot
                                    ? "bg-primary"
                                    : "bg-muted"
                            )}
                        />
                    ))}
                </div>

                {/* CARGA + REPS inputs */}
                <div className="flex gap-3">
                    <div className="flex-1 flex flex-col gap-1">
                        <span className="text-[11px] font-medium tracking-[0.04em] uppercase text-muted-foreground text-center">
                            Carga
                        </span>
                        <input
                            ref={weightRef}
                            type="number"
                            inputMode="decimal"
                            placeholder={suggestions.weight ? `${suggestions.weight}` : "0"}
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            disabled={isPending || wasSubmitted}
                            className="input-workout"
                            onFocus={() => handleFocusScroll(weightRef)}
                        />
                        <span className="text-[12px] text-muted-foreground text-center">kg</span>
                    </div>

                    <div className="flex-1 flex flex-col gap-1">
                        <span className="text-[11px] font-medium tracking-[0.04em] uppercase text-muted-foreground text-center">
                            Reps
                        </span>
                        <input
                            ref={repsRef}
                            type="number"
                            inputMode="numeric"
                            placeholder={record.targetReps.toString()}
                            value={reps}
                            onChange={(e) => setReps(e.target.value)}
                            disabled={isPending || wasSubmitted}
                            className="input-workout"
                            onFocus={() => handleFocusScroll(repsRef)}
                        />
                        <span className="text-[12px] text-muted-foreground text-center">repetições</span>
                    </div>
                </div>

                {/* Equipment weight (optional) */}
                {showEquipmentWeight && (
                    <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-medium tracking-[0.04em] uppercase text-muted-foreground text-center">
                            Peso da Barra
                        </span>
                        <input
                            type="number"
                            inputMode="decimal"
                            placeholder="kg"
                            value={equipmentWeight}
                            onChange={(e) => setEquipmentWeight(e.target.value)}
                            disabled={isPending || wasSubmitted}
                            className="input-workout"
                        />
                    </div>
                )}

                {/* RPE selector */}
                <div className="flex flex-col gap-2">
                    <span className="text-[11px] font-medium tracking-[0.04em] uppercase text-muted-foreground">
                        RPE
                    </span>
                    <RpeSelector value={rpe} onChange={setRpe} disabled={isPending || wasSubmitted} />
                </div>

                {/* Confirm button */}
                <motion.button
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    onClick={handleConfirm}
                    disabled={isPending || wasSubmitted || !weight || !reps}
                    className={cn(
                        "btn-session-confirm",
                        (isPending || wasSubmitted || !weight || !reps) && "opacity-40 cursor-not-allowed"
                    )}
                >
                    {isPending || wasSubmitted ? (
                        <span className="flex items-center justify-center gap-2">
                            <Loader2 className="size-4 animate-spin" />
                            Confirmando...
                        </span>
                    ) : (
                        `Confirmar set ${activeSetNumber}`
                    )}
                </motion.button>
            </motion.div>

            {/* Future sets */}
            {Array.from({ length: pendingSetsCount }).map((_, idx) => {
                const futureSetNum = activeSetNumber + 1 + idx;
                return (
                    <PendingSetRow
                        key={`pending-${futureSetNum}`}
                        setNum={futureSetNum}
                        reps={record.targetReps}
                        weight={suggestions.weight}
                    />
                );
            })}
        </motion.div>
    );
};

export default ActiveExerciseCard;
