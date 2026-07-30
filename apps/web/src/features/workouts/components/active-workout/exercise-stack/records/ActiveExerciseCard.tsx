import { motion, AnimatePresence } from "framer-motion";
import { MoreHorizontal, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { useActiveExerciseCardLogic } from "@/features/workouts/hooks/useActiveExerciseCardLogic.ts";
import { useActiveSetInput } from "@/features/workouts/hooks/useActiveSetInput.ts";
import { MuscleBadge } from "@/core/components/MuscleBadge";
import { CompletedSetRow } from "./CompletedSetRow";
import { PendingSetRow } from "./PendingSetRow";
import { RpeSelector } from "../../components/RpeSelector";
import { Textarea } from "@/components/ui/textarea";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { EnrichedExerciseRecord, WorkoutSession } from "@/features/workouts/workout.types.ts";
import { UNITS } from "@/core/constants/units.ts";

type ActiveExerciseCardProps = {
    record: EnrichedExerciseRecord;
    sessionId: number;
    lastSession?: WorkoutSession | null;
};

const ActiveExerciseCard = ({ record, sessionId, lastSession }: ActiveExerciseCardProps) => {
    const {
        showEquipmentWeight,
        toggleEquipmentWeight,
        suggestions,
        activeSetNumber,
        pendingSetsCount,
        handleSetConfirm,
        isPending,
        noteVisible,
        toggleNote,
        note,
        setNote,
    } = useActiveExerciseCardLogic(record, sessionId, lastSession);

    const { state, refs, actions } = useActiveSetInput({
        setNumber: activeSetNumber,
        targetReps: record.targetReps,
        previousWeight: suggestions.weight,
        previousEquipmentWeight: suggestions.equipWeight,
        onConfirm: (data) => handleSetConfirm(activeSetNumber, data),
        isPending,
    });

    const { weight, reps, rpe, equipmentWeight, wasSubmitted } = state;
    const { containerRef, weightRef, repsRef, equipmentRef } = refs;
    const { setWeight, setReps, setRpe, setEquipmentWeight, handleConfirm, handleFieldKeyDown } = actions;

    // Scrolling the focused field into view is handled globally by
    // useKeepFocusedFieldVisible (mounted in Layout), which also covers the bar-weight
    // input and the note textarea that this card's ad-hoc handler used to miss.

    const doneDots = record.logs.length;
    const totalDots = record.effectiveTargetSets;

    return (
        <motion.div layout className="flex flex-col gap-2">
            <AnimatePresence>
                {record.logs.map(log => (
                    <CompletedSetRow key={log.id} log={log} />
                ))}
            </AnimatePresence>

            {/* Keeping the whole card on screen — not just the focused input — is what
                keeps the RPE chips and the confirm button reachable with the keyboard up. */}
            <motion.div
                layout
                ref={containerRef}
                data-keyboard-anchor
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
                            <DropdownMenuItem onSelect={toggleNote}>
                                {noteVisible ? "Ocultar nota" : "Adicionar nota"}
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
                                    : idx === doneDots
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
                        {/* type="text" e não "number": com "number" o browser descarta a
                            vírgula decimal do teclado pt-BR e "82,5" chega como "". */}
                        <input
                            ref={weightRef}
                            type="text"
                            inputMode="decimal"
                            enterKeyHint="next"
                            aria-label="Carga"
                            placeholder={suggestions.weight ? `${suggestions.weight}` : "0"}
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            onKeyDown={handleFieldKeyDown("weight")}
                            disabled={isPending || wasSubmitted}
                            className="input-workout"
                        />
                        <span className="text-[12px] text-muted-foreground text-center">{UNITS.WEIGHT}</span>
                    </div>

                    <div className="flex-1 flex flex-col gap-1">
                        <span className="text-[11px] font-medium tracking-[0.04em] uppercase text-muted-foreground text-center">
                            Reps
                        </span>
                        <input
                            ref={repsRef}
                            type="text"
                            inputMode="numeric"
                            enterKeyHint={showEquipmentWeight ? "next" : "done"}
                            aria-label="Repetições"
                            placeholder={record.targetReps.toString()}
                            value={reps}
                            onChange={(e) => setReps(e.target.value)}
                            onKeyDown={handleFieldKeyDown("reps")}
                            disabled={isPending || wasSubmitted}
                            className="input-workout"
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
                            ref={equipmentRef}
                            type="text"
                            inputMode="decimal"
                            enterKeyHint="done"
                            aria-label="Peso da barra"
                            placeholder={UNITS.WEIGHT}
                            value={equipmentWeight}
                            onChange={(e) => setEquipmentWeight(e.target.value)}
                            onKeyDown={handleFieldKeyDown("equipment")}
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

                {/* Note textarea (optional) — sem override de font-size: o base do
                    Textarea é 16px no mobile, e abaixo disso o iOS dá zoom ao focar. */}
                {noteVisible && (
                    <Textarea
                        placeholder="Observações sobre o exercício..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="resize-none min-h-[64px]"
                        rows={2}
                    />
                )}

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
                        `Confirmar ${UNITS.SINGLE_SET} ${activeSetNumber}`
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
