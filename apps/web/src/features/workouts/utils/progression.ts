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
    /** De onde veio a prescrição: sessões passadas ou os sets já registrados nesta. */
    scope: "history" | "session";
}

export interface ExecutionSummary {
    workWeight: number;
    minReps: number;
    maxRpe: number;
    equipmentWeight: number;
    setsAtWorkWeight: number;
}

/** O mínimo que a prescrição precisa saber de um set já registrado. */
export interface LoggedSet {
    actualWeight: number;
    actualReps: number;
    rpe: number;
    equipmentWeight?: number | null;
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
 * A carga de trabalho é o set MAIS PESADO da execução — é ele que a progressão
 * persegue. Rampa (40→45→50), back-off e drop set progridem todos a partir do topo.
 * A regra anterior era a moda dos pesos com desempate pelo menor, que devolvia o set
 * mais leve sempre que os pesos não se repetiam — ou seja, em qualquer sessão em
 * rampa a referência virava a primeira série.
 *
 * Reps e RPE são medidos SÓ nos sets no peso de trabalho: um drop set a 20 kg não
 * deve derrubar a avaliação de uma série a 50 kg.
 */
export const summarizeExecution = (execution: ExerciseExecution): ExecutionSummary | null => {
    if (!execution.sets.length) return null;

    const workWeight = Math.max(...execution.sets.map(set => set.actualWeight));
    const workSets = execution.sets.filter(set => set.actualWeight === workWeight);

    return {
        workWeight,
        minReps:          Math.min(...workSets.map(set => set.actualReps)),
        maxRpe:           Math.max(...workSets.map(set => set.rpe)),
        equipmentWeight:  workSets[0].equipmentWeight ?? 0,
        setsAtWorkWeight: workSets.length,
    };
};

/** Incremento plausível quando não há dois pontos no histórico para medir o salto real. */
export const bandIncrement = (workWeight: number): number => {
    if (workWeight < 20) return 1;
    if (workWeight < 60) return 2.5;
    return 5;
};

/**
 * O incremento de carga é derivado, não configurado: é o menor salto positivo entre
 * as CARGAS DE TRABALHO de sessões diferentes — é essa a escada que o usuário sobe.
 * Saltos dentro de uma mesma sessão (a rampa 40→45→50) não são incremento de
 * progressão e falseariam a escala. Sem duas cargas de trabalho distintas, cai no
 * fallback por faixa.
 */
export const inferIncrement = (summaries: ExecutionSummary[], workWeight: number): number => {
    const workWeights = [...new Set(summaries.map(summary => summary.workWeight))]
        .sort((a, b) => a - b);

    let smallest = Infinity;
    for (let i = 1; i < workWeights.length; i++) {
        const delta = workWeights[i] - workWeights[i - 1];
        if (delta > 0 && delta < smallest) smallest = delta;
    }

    if (smallest === Infinity) return bandIncrement(workWeight);

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
            increment: bandIncrement(0),
            reason: "Primeira vez neste exercício — registre uma carga de referência.",
            stalledSessions: 0,
            scope: "history",
        };
    }

    const last = summaries[0];
    const increment = inferIncrement(summaries, last.workWeight);
    const stalledSessions = countStall(summaries, last.workWeight);

    const base = {
        suggestedEquipmentWeight: last.equipmentWeight,
        repRange,
        increment,
        stalledSessions,
        scope: "history" as const,
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
            reason: `${stalledSessions} sessões travado em ${weightLabel} kg a RPE ${last.maxRpe} — recue para ${formatWeightPtBr(deloadWeight)} kg.`,
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
            reason: `Você fechou ${last.setsAtWorkWeight}×${last.minReps} em ${weightLabel} kg a RPE ${last.maxRpe} — suba para ${formatWeightPtBr(nextWeight)} kg.`,
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
                : `Você fez ${last.minReps} reps em ${weightLabel} kg, abaixo de ${repRange.min} — repita a carga.`,
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
            ? `Faixa fechada em ${weightLabel} kg, mas a RPE ${last.maxRpe} — consolide antes de subir.`
            : `Mantenha ${weightLabel} kg e busque ${suggestedReps} reps (topo da faixa: ${repRange.max}).`,
    };
};

/**
 * Prescrição para o próximo set, dado o set que acabou de sair.
 *
 * Mesma dupla progressão do motor de histórico, aplicada intra-sessão. `previous`
 * entra só pela faixa de reps e pelo incremento — a carga de referência é a que o
 * usuário ACABOU de levantar, nunca a que estava prescrita. É o que mantém o card
 * coerente quando ele registra 50 kg onde o prescrito era 42,5.
 *
 * @param setNumber Número (1-based) do set que acabou de ser registrado.
 */
export const advanceAdvice = (
    previous: ProgressionAdvice,
    set: LoggedSet,
    setNumber: number,
): ProgressionAdvice => {
    const { repRange } = previous;
    // O incremento de NO_HISTORY foi inferido sem carga nenhuma e vale sempre 1 —
    // agora que existe um peso real, a faixa dele é que manda.
    const increment = previous.verdict === "NO_HISTORY"
        ? bandIncrement(set.actualWeight)
        : previous.increment;

    const base = {
        suggestedEquipmentWeight: set.equipmentWeight ?? 0,
        repRange,
        increment,
        stalledSessions: previous.stalledSessions,
        scope: "session" as const,
    };
    const weightLabel = formatWeightPtBr(set.actualWeight);
    const done = `Set ${setNumber}: ${set.actualReps} reps a RPE ${set.rpe}`;

    // 1. Falhou e saiu caro: recua um incremento para salvar o resto do exercício.
    if (set.rpe >= 10 && set.actualReps < repRange.min) {
        const deloadWeight = Math.max(0, roundToIncrement(set.actualWeight - increment, increment));
        return {
            ...base,
            verdict: "DELOAD",
            suggestedWeight: deloadWeight,
            suggestedReps: repRange.min,
            reason: `${done} — recue para ${formatWeightPtBr(deloadWeight)} kg.`,
        };
    }

    // 2. Fechou o topo da faixa sem custo de RPE: sobe já no próximo set.
    if (set.actualReps >= repRange.max && set.rpe <= 8) {
        const nextWeight = roundToIncrement(set.actualWeight + increment, increment);
        return {
            ...base,
            verdict: "INCREASE",
            suggestedWeight: nextWeight,
            suggestedReps: repRange.min,
            reason: `${done} — suba para ${formatWeightPtBr(nextWeight)} kg.`,
        };
    }

    // 3. Veto por RPE, ou abaixo do piso da faixa: mantém a carga e busca o piso.
    if (set.rpe >= 10 || set.actualReps < repRange.min) {
        return {
            ...base,
            verdict: "REPEAT",
            suggestedWeight: set.actualWeight,
            suggestedReps: repRange.min,
            reason: `${done} — repita ${weightLabel} kg e busque ${repRange.min} reps.`,
        };
    }

    // 4. Dentro da faixa: mesma carga, uma rep a mais.
    const suggestedReps = Math.min(set.actualReps + 1, repRange.max);
    return {
        ...base,
        verdict: "HOLD",
        suggestedWeight: set.actualWeight,
        suggestedReps,
        reason: `${done} — mantenha ${weightLabel} kg e busque ${suggestedReps} reps.`,
    };
};

/**
 * Prescrições encadeadas para um exercício. O índice i é o que estava prescrito para
 * o set i+1, e o último elemento é a prescrição do set ativo.
 *
 * Guardar cada estado intermediário — em vez de só o atual — é o que permite julgar
 * o desvio de um set concluído contra o que valia NAQUELE set. Comparar tudo contra
 * a prescrição corrente marcaria como desvio todo set anterior a uma mudança de carga.
 *
 * @returns Array de comprimento `sessionSets.length + 1`.
 */
export const buildAdviceChain = (
    history: ExerciseExecution[],
    targetReps: number,
    sessionSets: LoggedSet[],
): ProgressionAdvice[] => {
    const chain: ProgressionAdvice[] = [getProgressionAdvice(history, targetReps)];

    sessionSets.forEach((set, index) => {
        chain.push(advanceAdvice(chain[index], set, index + 1));
    });

    return chain;
};
