import { motion } from "framer-motion";
import { MoreHorizontal, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { useActiveExerciseCardLogic } from "@/features/workouts/hooks/useActiveExerciseCardLogic.ts";
import { useActiveSetInput } from "@/features/workouts/hooks/useActiveSetInput.ts";
import { MuscleBadge } from "@/core/components/MuscleBadge";
import { CompletedSetRow } from "./CompletedSetRow";
import { RpeSelector } from "../../components/RpeSelector";
import { ProgressionChip } from "../../components/ProgressionChip";
import SessionGroupBadge from "../../components/SessionGroupBadge";
import SkipExerciseButton from "./SkipExerciseButton";
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
import { LOAD_TYPE_HINT, LOAD_TYPE_LABEL } from "@/features/workouts/utils/movement.ts";
import { UNITS } from "@/core/constants/units.ts";

type ActiveExerciseCardProps = {
    record: EnrichedExerciseRecord;
    sessionId: number;
    history?: ExerciseHistoryMap;
};

const FIELD_LABEL = "text-[13px] text-muted-foreground text-center";

const ActiveExerciseCard = ({ record, sessionId, history }: ActiveExerciseCardProps) => {
    const {
        showEquipmentWeight,
        toggleEquipmentWeight,
        advice,
        adviceChain,
        seed,
        activeSetNumber,
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
    const { weightRef, repsRef, equipmentRef } = refs;
    const { setWeight, setReps, setRpe, setEquipmentWeight, handleConfirm, handleFieldKeyDown } = actions;

    // Scrolling the focused field into view is handled globally by
    // useKeepFocusedFieldVisible (mounted in Layout), which also covers the bar-weight
    // input and the note textarea that this card's ad-hoc handler used to miss.

    const doneSets = record.logs.length;
    const totalSets = record.effectiveTargetSets;

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
        log.actualWeight === null ? undefined : deviationAgainst(adviceChain[index], log.actualWeight);

    const typedWeight = parseFloat(weight.replace(",", "."));
    const isOverPrescribed = advice.verdict !== "INCREASE"
        && Number.isFinite(typedWeight)
        && deviationAgainst(advice, typedWeight) === "up";

    const loadLabel = LOAD_TYPE_LABEL[record.exercise.loadType] ?? "Carga";
    const loadHint = LOAD_TYPE_HINT[record.exercise.loadType];

    return (
        <motion.div layout className="flex flex-col gap-2">
            {/* As séries feitas viram uma lista só, fora do card ativo: dentro dele
                aumentariam o [data-keyboard-anchor], e com o teclado aberto o botão
                de confirmar sairia da tela. */}
            {record.logs.length > 0 && (
                <div className="rounded-xl bg-card border border-border divide-y divide-border">
                    {record.logs.map((log, index) => (
                        <CompletedSetRow key={log.id} log={log} deviation={logDeviation(log, index)} />
                    ))}
                </div>
            )}

            {/* Keeping the whole card on screen — not just the focused input — is what
                keeps the RPE chips and the confirm button reachable with the keyboard up.
                Daí o gap-3 em vez de gap-4: passar de visualViewport.height − 32 derruba
                useKeepFocusedFieldVisible para o fallback que esconde o botão Confirmar. */}
            <motion.div
                layout
                data-keyboard-anchor
                className="border-2 border-primary/40 rounded-xl bg-card p-4 flex flex-col gap-3"
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-2 min-w-0">
                        <h2 className="text-[20px] font-semibold tracking-[-0.02em] leading-tight text-foreground">
                            {record.exercise.name}
                        </h2>
                        <div className="flex items-center flex-wrap gap-2">
                            <ProgressionChip advice={advice} />
                            <MuscleBadge muscle={record.exercise.targetMuscle} />
                            <SessionGroupBadge group={record.group} />
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                aria-label="Mais opções"
                                className="relative tap-target text-muted-foreground p-1 hover:text-foreground transition-colors flex-shrink-0"
                            >
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
                                para referenciar no servidor. Pular saiu daqui para
                                baixo do card: no menu, só achava quem já sabia. */}
                            {canChangePlan && (
                                <DropdownMenuItem onSelect={openAlternatives} disabled={isChangingPlan}>
                                    Trocar exercício
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Progresso + razão. A razão precisa da largura inteira: dividindo a
                    linha ela sobrava com ~45 caracteres e o `truncate` comia justamente
                    o trecho que carrega a decisão ("— suba para 42,5 kg"). A barra em
                    blocos é a mesma linguagem do modo simples e substitui as linhas de
                    séries futuras, que repetiam o que o campo já mostra. */}
                <div className="flex flex-col gap-1.5">
                    <div
                        className="flex items-center gap-1"
                        role="img"
                        aria-label={`Set ${activeSetNumber} de ${totalSets}`}
                    >
                        {Array.from({ length: totalSets }).map((_, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "h-1.5 flex-1 rounded-full transition-colors",
                                    idx < doneSets
                                        ? "bg-success"
                                        : idx === doneSets
                                        ? "bg-primary"
                                        : "bg-muted"
                                )}
                            />
                        ))}
                    </div>
                    <span className="text-[12px] leading-snug text-muted-foreground line-clamp-2">
                        {advice.reason}
                    </span>
                </div>

                {/* CARGA + REPS inputs */}
                <div className="flex gap-3">
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <span className={FIELD_LABEL}>
                            {loadLabel} ({UNITS.WEIGHT})
                        </span>
                        {/* type="text" e não "number": com "number" o browser descarta a
                            vírgula decimal do teclado pt-BR e "82,5" chega como "". */}
                        <input
                            ref={weightRef}
                            type="text"
                            inputMode="decimal"
                            enterKeyHint="next"
                            aria-label={loadLabel}
                            placeholder={seed.weight != null ? `${seed.weight}` : "0"}
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            onKeyDown={handleFieldKeyDown("weight")}
                            disabled={isPending || wasSubmitted}
                            className="input-workout"
                        />
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <span className={FIELD_LABEL}>Reps</span>
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
                    </div>
                </div>

                {/* Só ocupa altura quando tem o que dizer. Avisa o desvio sem bloquear o
                    registro; para peso corporal/assistido, explica o que o número
                    significa — sem isso dá pra confundir carga extra com o peso corporal
                    inteiro (ex.: Dips). */}
                {(isOverPrescribed || loadHint) && (
                    <p className={cn(
                        "text-[12px] text-center -mt-1",
                        isOverPrescribed ? "text-destructive" : "text-muted-foreground"
                    )}>
                        {isOverPrescribed
                            ? `Acima do prescrito: ${formatWeightPtBr(advice.suggestedWeight!)} ${UNITS.WEIGHT}`
                            : loadHint}
                    </p>
                )}

                {/* Equipment weight (optional). Uma linha compacta e não um campo do
                    tamanho de Carga/Reps: é um valor de montagem que quase nunca muda
                    entre séries. text-[16px] no input: abaixo disso o iOS dá zoom. */}
                {showEquipmentWeight && (
                    <label className="flex items-center justify-between gap-3 h-11 px-3 rounded-md bg-muted/50">
                        <span className="text-[13px] text-muted-foreground">Peso da barra</span>
                        <span className="flex items-center gap-1.5">
                            <input
                                ref={equipmentRef}
                                type="text"
                                inputMode="decimal"
                                enterKeyHint="done"
                                aria-label="Peso da barra"
                                placeholder="0"
                                value={equipmentWeight}
                                onChange={(e) => setEquipmentWeight(e.target.value)}
                                onKeyDown={handleFieldKeyDown("equipment")}
                                disabled={isPending || wasSubmitted}
                                className="w-16 h-8 rounded-md bg-muted border border-border text-center text-[16px] font-medium tabular-nums text-foreground focus:outline-none focus:border-primary"
                            />
                            <span className="text-[13px] text-muted-foreground">{UNITS.WEIGHT}</span>
                        </span>
                    </label>
                )}

                {/* RPE selector */}
                <div className="flex flex-col gap-1">
                    <span className="text-[13px] text-muted-foreground">Esforço (RPE)</span>
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

            {/* Fora do card de propósito: dentro ele aumentaria o
                [data-keyboard-anchor] e empurraria o Confirmar para fora da tela
                com o teclado aberto. Pular só antes da primeira série — o servidor
                recusa com série registrada. */}
            {canChangePlan && record.logs.length === 0 && (
                <SkipExerciseButton onSkip={handleSkip} disabled={isChangingPlan} />
            )}

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
