import { motion, AnimatePresence } from "framer-motion";
import { MoreHorizontal, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { useActiveExerciseCardLogic } from "@/features/workouts/hooks/useActiveExerciseCardLogic.ts";
import { useActiveSetInput } from "@/features/workouts/hooks/useActiveSetInput.ts";
import { MuscleBadge } from "@/core/components/MuscleBadge";
import { CompletedSetRow } from "./CompletedSetRow";
import { PendingSetRow } from "./PendingSetRow";
import { RpeSelector } from "../../components/RpeSelector";
import { ProgressionChip } from "../../components/ProgressionChip";
import { Textarea } from "@/components/ui/textarea";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AlternativesSheet from "@/features/workouts/components/workout-editor/AlternativesSheet.tsx";
import type { EnrichedExerciseRecord, ExerciseHistoryMap, SessionSet } from "@/features/workouts/workout.types.ts";
import { formatWeightPtBr, type ProgressionAdvice } from "@/features/workouts/utils/progression.ts";
import { UNITS } from "@/core/constants/units.ts";

type ActiveExerciseCardProps = {
    record: EnrichedExerciseRecord;
    sessionId: number;
    history?: ExerciseHistoryMap;
};

const ActiveExerciseCard = ({ record, sessionId, history }: ActiveExerciseCardProps) => {
    const {
        showEquipmentWeight,
        toggleEquipmentWeight,
        advice,
        adviceChain,
        seed,
        activeSetNumber,
        pendingSetsCount,
        handleSetConfirm,
        isPending,
        noteVisible,
        toggleNote,
        note,
        setNote,
        canChangePlan,
        alternativesOpen,
        openAlternatives,
        closeAlternatives,
        handleSubstitute,
        handleSkip,
        isChangingPlan,
    } = useActiveExerciseCardLogic(record, sessionId, history);

    const { state, refs, actions } = useActiveSetInput({
        exerciseId: record.exerciseId,
        setNumber: activeSetNumber,
        seed,
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

    // Meia-casa de incremento é a tolerância: arredondamentos e anilhas diferentes
    // não devem virar aviso. Avisa e marca, nunca bloqueia — o set grava normalmente.
    const deviationAgainst = (
        prescription: ProgressionAdvice,
        value: number
    ): "up" | "down" | undefined => {
        if (prescription.suggestedWeight == null) return undefined;
        const tolerance = prescription.increment / 2;
        if (value > prescription.suggestedWeight + tolerance) return "up";
        if (value < prescription.suggestedWeight - tolerance) return "down";
        return undefined;
    };

    // Cada set concluído é julgado contra o que estava prescrito PARA ELE. Comparar
    // tudo contra a prescrição corrente marcaria como desvio todo set anterior a uma
    // mudança de carga — inclusive a que o próprio set causou.
    const logDeviation = (log: SessionSet, index: number) =>
        deviationAgainst(adviceChain[index], log.actualWeight);

    const typedWeight = parseFloat(weight.replace(",", "."));
    const isOverPrescribed = advice.verdict !== "INCREASE"
        && Number.isFinite(typedWeight)
        && deviationAgainst(advice, typedWeight) === "up";

    return (
        <motion.div layout className="flex flex-col gap-2">
            <AnimatePresence>
                {record.logs.map((log, index) => (
                    <CompletedSetRow key={log.id} log={log} deviation={logDeviation(log, index)} />
                ))}
            </AnimatePresence>

            {/* Keeping the whole card on screen — not just the focused input — is what
                keeps the RPE chips and the confirm button reachable with the keyboard up.
                Daí o gap-3 em vez de gap-4: a linha da razão custa ~32px, e passar de
                visualViewport.height − 32 derruba useKeepFocusedFieldVisible para o
                fallback que esconde o botão Confirmar. */}
            <motion.div
                layout
                ref={containerRef}
                data-keyboard-anchor
                className="border-2 border-primary/40 rounded-xl bg-card p-4 flex flex-col gap-3"
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-base font-medium tracking-[-0.02em] text-foreground">
                            {record.exercise.name}
                        </span>
                        <div className="flex items-center gap-2">
                            <ProgressionChip advice={advice} />
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
                            {/* Só com snapshot: sessão legada não tem SessionExercise
                                para referenciar no servidor. */}
                            {canChangePlan && (
                                <>
                                    <DropdownMenuItem onSelect={openAlternatives} disabled={isChangingPlan}>
                                        Trocar exercício
                                    </DropdownMenuItem>
                                    {/* Pular só faz sentido antes da primeira série —
                                        o servidor recusa com série registrada. */}
                                    {record.logs.length === 0 && (
                                        <DropdownMenuItem onSelect={handleSkip} disabled={isChangingPlan}>
                                            Pular exercício
                                        </DropdownMenuItem>
                                    )}
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Progress dots + razão. A razão precisa da largura inteira: dividindo
                    a linha dos dots ela sobrava com ~45 caracteres e o `truncate` comia
                    justamente o trecho que carrega a decisão ("— suba para 42,5 kg").
                    Agrupados num filho só do card para custar um gap, não dois. */}
                <div className="flex flex-col gap-1">
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
                    <span className="text-[11px] leading-snug text-muted-foreground line-clamp-2">
                        {advice.reason}
                    </span>
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
                            placeholder={seed.weight != null ? `${seed.weight}` : "0"}
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            onKeyDown={handleFieldKeyDown("weight")}
                            disabled={isPending || wasSubmitted}
                            className="input-workout"
                        />
                        {/* Substitui a legenda "kg" em vez de somar uma linha — custo
                            vertical zero. Avisa e marca o desvio, sem bloquear o registro. */}
                        <span className={cn(
                            "text-[12px] text-center",
                            isOverPrescribed ? "text-destructive" : "text-muted-foreground"
                        )}>
                            {isOverPrescribed
                                ? `acima do prescrito · ${formatWeightPtBr(advice.suggestedWeight!)} ${UNITS.WEIGHT}`
                                : UNITS.WEIGHT}
                        </span>
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
                        reps={advice.suggestedReps}
                        weight={advice.suggestedWeight ?? undefined}
                    />
                );
            })}

            {/* Mesma sheet do editor de treino: aqui a escolha vira uma chamada de
                API, lá vira troca no rascunho. */}
            <AlternativesSheet
                target={alternativesOpen ? record.exercise : null}
                onClose={closeAlternatives}
                onSelect={handleSubstitute}
                isPending={isChangingPlan}
            />
        </motion.div>
    );
};

export default ActiveExerciseCard;
