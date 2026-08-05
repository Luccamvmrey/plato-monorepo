import type { ExerciseExecution } from "../workout.types";

export type ProgressionVerdict = "INCREASE" | "HOLD" | "REPEAT" | "DELOAD" | "NO_HISTORY";

export interface ProgressionAdvice {
    verdict: ProgressionVerdict;
    /** null apenas em NO_HISTORY — não há carga de referência para prescrever. */
    suggestedWeight: number | null;
    /** Repete o da última execução (0 quando não houve barra), para o toggle não perder o valor. */
    suggestedEquipmentWeight: number;
    suggestedReps: number;
    repRange: { min: number; max: number };
    increment: number;
    /** Uma linha em pt-BR, com números concretos. */
    reason: string;
    stalledSessions: number;
}

interface ExecutionSummary {
    workWeight: number;
    minReps: number;
    maxRpe: number;
    equipmentWeight: number;
    setsAtWorkWeight: number;
}

/** A faixa de reps é derivada do plano: [targetReps, targetReps + 2]. Não há config por exercício. */
export const REP_RANGE_SPREAD = 2;

/** Formata carga no padrão pt-BR. Só para texto — o prefill dos inputs usa toString(). */
export const formatWeightPtBr = (value: number): string =>
    Number(value.toFixed(1)).toString().replace(".", ",");

/** Arredonda para o múltiplo mais próximo do incremento, com uma casa decimal. */
export const roundToIncrement = (value: number, increment: number): number => {
    if (increment <= 0) return Math.round(value * 10) / 10;
    return Math.round((Math.round(value / increment) * increment) * 10) / 10;
};

/**
 * Reduz uma execução ao par (carga de trabalho, desempenho nela).
 *
 * A carga de trabalho é o peso mais frequente entre os sets — empate resolve pelo
 * menor, que é a leitura conservadora. Reps e RPE são medidos SÓ nos sets nesse
 * peso: um drop set a 20 kg não deve derrubar a avaliação de uma série a 40 kg.
 */
export const summarizeExecution = (execution: ExerciseExecution): ExecutionSummary | null => {
    if (!execution.sets.length) return null;

    const frequency = new Map<number, number>();
    for (const set of execution.sets) {
        frequency.set(set.actualWeight, (frequency.get(set.actualWeight) ?? 0) + 1);
    }

    let workWeight = execution.sets[0].actualWeight;
    let bestCount = 0;
    for (const [weight, count] of frequency) {
        if (count > bestCount || (count === bestCount && weight < workWeight)) {
            workWeight = weight;
            bestCount = count;
        }
    }

    const workSets = execution.sets.filter(set => set.actualWeight === workWeight);

    return {
        workWeight,
        minReps:          Math.min(...workSets.map(set => set.actualReps)),
        maxRpe:           Math.max(...workSets.map(set => set.rpe)),
        equipmentWeight:  workSets[0].equipmentWeight ?? 0,
        setsAtWorkWeight: workSets.length,
    };
};

/**
 * O incremento de carga é derivado, não configurado: é o menor salto positivo que
 * o usuário já deu neste exercício. Sem dois pesos distintos no histórico, cai num
 * fallback por faixa de carga (halteres leves sobem de 1 em 1, barra de 5 em 5).
 */
export const inferIncrement = (history: ExerciseExecution[], workWeight: number): number => {
    const weights = [...new Set(
        history.flatMap(execution => execution.sets.map(set => set.actualWeight))
    )].sort((a, b) => a - b);

    let smallest = Infinity;
    for (let i = 1; i < weights.length; i++) {
        const delta = weights[i] - weights[i - 1];
        if (delta > 0 && delta < smallest) smallest = delta;
    }

    if (smallest === Infinity) {
        if (workWeight < 20) return 1;
        if (workWeight < 60) return 2.5;
        return 5;
    }

    return Math.min(10, Math.max(1, smallest));
};

/**
 * Quantas execuções consecutivas, da mais recente para trás, usaram a mesma carga
 * sem melhorar as reps mínimas. É o sinal de estagnação que justifica o deload.
 */
export const countStall = (summaries: ExecutionSummary[], workWeight: number): number => {
    let stalled = 0;

    for (let i = 0; i < summaries.length; i++) {
        if (summaries[i].workWeight !== workWeight) break;
        stalled++;

        const older = summaries[i + 1];
        if (!older || older.workWeight !== workWeight) break;
        if (summaries[i].minReps > older.minReps) break;
    }

    return stalled;
};

/**
 * Prescreve a próxima carga a partir do histórico recente do exercício.
 *
 * Motor híbrido: a dupla progressão (fechar o topo da faixa de reps antes de subir
 * a carga) é a regra, e o RPE é o veto. RPE 8 é o DEFAULT do seletor no app, não
 * uma afirmação do usuário — por isso o teto para liberar aumento é `maxRpe <= 8`
 * (o default nunca bloqueia), o veto real começa em 9 e 10 é sinal de recuo.
 *
 * @param history Execuções do mais recente para o mais antigo.
 * @param targetReps Reps planejadas em WorkoutExercise — o piso da faixa.
 */
export const getProgressionAdvice = (
    history: ExerciseExecution[],
    targetReps: number,
): ProgressionAdvice => {
    const repRange = { min: targetReps, max: targetReps + REP_RANGE_SPREAD };

    const summaries = history
        .map(summarizeExecution)
        .filter((summary): summary is ExecutionSummary => summary !== null);

    // 1. Sem histórico útil — nada a prescrever, só um pedido de referência.
    if (!summaries.length) {
        return {
            verdict: "NO_HISTORY",
            suggestedWeight: null,
            suggestedEquipmentWeight: 0,
            suggestedReps: repRange.min,
            repRange,
            increment: inferIncrement(history, 0),
            reason: "Primeira vez neste exercício — registre uma carga de referência.",
            stalledSessions: 0,
        };
    }

    const last = summaries[0];
    const increment = inferIncrement(history, last.workWeight);
    const stalledSessions = countStall(summaries, last.workWeight);

    const base = {
        suggestedEquipmentWeight: last.equipmentWeight,
        repRange,
        increment,
        stalledSessions,
    };
    const weightLabel = formatWeightPtBr(last.workWeight);

    // 2. Travado e caro: recuar é a única saída que reconstrói.
    if (stalledSessions >= 3 && last.maxRpe >= 9) {
        const deloadWeight = roundToIncrement(last.workWeight * 0.9, increment);
        return {
            ...base,
            verdict: "DELOAD",
            suggestedWeight: deloadWeight,
            suggestedReps: repRange.min,
            reason: `${stalledSessions} sessões travado em ${weightLabel} kg com RPE ${last.maxRpe} — recue para ${formatWeightPtBr(deloadWeight)} kg e reconstrua.`,
        };
    }

    // 3. Dupla progressão: fechou o topo da faixa sem custo de RPE, sobe a carga.
    if (last.minReps >= repRange.max && last.maxRpe <= 8) {
        const nextWeight = roundToIncrement(last.workWeight + increment, increment);
        return {
            ...base,
            verdict: "INCREASE",
            suggestedWeight: nextWeight,
            suggestedReps: repRange.min,
            reason: `Você fechou ${last.setsAtWorkWeight}×${last.minReps} em ${weightLabel} kg com RPE ${last.maxRpe} — suba para ${formatWeightPtBr(nextWeight)} kg.`,
        };
    }

    // 4. Veto por RPE, ou desempenho abaixo do piso da faixa: repetir a carga.
    if (last.maxRpe >= 10 || last.minReps < repRange.min) {
        return {
            ...base,
            verdict: "REPEAT",
            suggestedWeight: last.workWeight,
            suggestedReps: repRange.min,
            reason: last.maxRpe >= 10
                ? `Última execução saiu a RPE ${last.maxRpe} — repita ${weightLabel} kg antes de subir.`
                : `Você fez ${last.minReps} reps em ${weightLabel} kg, abaixo da faixa de ${repRange.min}-${repRange.max} — repita a carga.`,
        };
    }

    // 5. Dentro da faixa: mesma carga, uma rep a mais.
    const atTopOfRange = last.minReps >= repRange.max;
    const suggestedReps = Math.min(last.minReps + 1, repRange.max);

    return {
        ...base,
        verdict: "HOLD",
        suggestedWeight: last.workWeight,
        suggestedReps,
        reason: atTopOfRange
            ? `Faixa fechada em ${weightLabel} kg, mas com RPE ${last.maxRpe} — consolide antes de subir.`
            : `Mantenha ${weightLabel} kg e busque ${suggestedReps} reps (faltam ${repRange.max - last.minReps} para o topo da faixa).`,
    };
};
