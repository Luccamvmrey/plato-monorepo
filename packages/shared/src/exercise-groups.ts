/**
 * Agrupamento de exercícios dentro de um treino — bi-set, tri-set, rest-pause.
 *
 * Hoje isso vive em texto livre na `description` do treino. Medido no banco em
 * 2026-08-11: 3 dos 5 treinos ativos do usuário 1 codificam estrutura assim
 * ("Rosca alternada e martelo - 2 x 2", "Bayesian - Coice - Martelo - Pulley. Rest
 * pause.", "Alternar desenvolvimento e elevação"). Texto livre não é legível pela
 * sessão, pelo histórico, nem pelo cálculo de volume.
 *
 * **Por que `groupKey` é rótulo e não chave estrangeira.** `workout.service.update` é
 * `deleteMany` + `createMany`, então toda linha de `WorkoutExercise` ganha id novo a
 * cada save e qualquer tabela filha seria apagada por cascade junto. Um rótulo
 * carregado na própria linha atravessa o replace intacto.
 */

/** Grupo é sempre contíguo: bi-set é feito em sequência, não espalhado pelo treino. */
export interface GroupableExercise {
    groupKey?: string | null;
    groupType?: string | null;
}

/**
 * `ALTERNATING` foi removido: na prática era a mesma coisa que `SUPERSET` — os dois
 * revezam série a série entre os exercícios, e a diferença de descanso que os
 * separaria no papel não muda nada no que a tela faz.
 */
export const EXERCISE_GROUP_TYPES = ["SUPERSET", "REST_PAUSE"] as const;

export type ExerciseGroupTypeValue = (typeof EXERCISE_GROUP_TYPES)[number];

export const DEFAULT_GROUP_TYPE: ExerciseGroupTypeValue = "SUPERSET";

/** Uma sequência contígua de exercícios que compartilham `groupKey`. */
export interface ExerciseGroupRun {
    groupKey: string;
    groupType: string;
    /** Índices na lista de entrada, contíguos e em ordem. */
    indexes: number[];
}

/**
 * As sequências contíguas válidas da lista, na ordem de execução.
 *
 * Só conta como grupo quem tem ao menos dois membros lado a lado. Um `groupKey`
 * sozinho é resíduo — sobra de quando o vizinho foi removido ou arrastado para longe.
 */
export const findExerciseGroups = (
    items: readonly GroupableExercise[]
): ExerciseGroupRun[] => {
    const runs: ExerciseGroupRun[] = [];
    const claimed = new Set<string>();

    let index = 0;

    while (index < items.length) {
        const key = items[index].groupKey;

        if (key == null || key === "") {
            index += 1;
            continue;
        }

        let end = index;
        while (end + 1 < items.length && items[end + 1].groupKey === key) end += 1;

        const length = end - index + 1;

        // Sequências posteriores com a mesma chave são resíduo de um reordenamento que
        // partiu o grupo em dois. A primeira válida fica com a chave; as outras caem,
        // de forma determinística — nada aqui inventa chave nova.
        if (length >= 2 && !claimed.has(key)) {
            claimed.add(key);
            runs.push({
                groupKey: key,
                groupType: items[index].groupType || DEFAULT_GROUP_TYPE,
                indexes: Array.from({ length }, (_, offset) => index + offset),
            });
        }

        index = end + 1;
    }

    return runs;
};

/**
 * Zera `groupKey`/`groupType` de quem não pertence a nenhuma sequência válida.
 *
 * Precisa rodar depois de qualquer reordenação ou remoção. Sem isso, arrastar um
 * membro de um bi-set para longe deixa os dois com a chave antiga e o treino passa a
 * afirmar um agrupamento que não existe mais.
 *
 * Devolve a mesma referência de objeto para quem não muda — o React não re-renderiza
 * linha que não foi tocada.
 */
export const normalizeExerciseGroups = <T extends GroupableExercise>(
    items: readonly T[]
): T[] => {
    const valid = new Set<number>();

    for (const run of findExerciseGroups(items)) {
        for (const index of run.indexes) valid.add(index);
    }

    return items.map((item, index) => {
        if (valid.has(index)) return item;
        if (item.groupKey == null && item.groupType == null) return item;

        return { ...item, groupKey: null, groupType: null };
    });
};

/**
 * Posição do exercício dentro do próprio grupo. `null` para quem não está agrupado.
 *
 * A UI precisa disso para desenhar o conector: quem é primeiro abre a chave, quem é
 * último fecha, quem está no meio continua.
 */
export interface GroupMembership {
    groupKey: string;
    groupType: string;
    position: number;
    size: number;
    isFirst: boolean;
    isLast: boolean;
}

/** O que o rodízio precisa saber sobre uma linha da pilha da sessão. */
export interface RotationItem extends GroupableExercise {
    /** Séries já registradas para este exercício nesta sessão. */
    completedSets: number;
    /** Pode receber a próxima série: não concluído, não pulado, não substituído. */
    eligible: boolean;
}

/**
 * Qual exercício deve receber a próxima série. `null` quando não sobrou nenhum.
 *
 * Fora de grupo é o de sempre: o primeiro elegível na ordem. **Dentro de um grupo o
 * exercício não é executado até o fim** — faz-se uma série de cada, revezando. Sem
 * isto um bi-set é só dois exercícios pintados de azul: a tela pedia as 3 séries da
 * Rosca e só depois as 3 da Extensão, que é exatamente o oposto de emendar um no
 * outro.
 *
 * A regra é "quem tem menos séries feitas vai agora", com empate resolvido pela
 * ordem. Ela produz o revezamento sozinha (0,0 → 1,0 → 1,1 → 2,1 …) e, de brinde,
 * se recupera de qualquer estado: uma série gravada fora de ordem, um exercício
 * pulado no meio, ou uma sessão retomada — o próximo passo continua sendo o membro
 * mais atrasado, sem precisar guardar de quem era a vez.
 */
export const findActiveExerciseIndex = (items: readonly RotationItem[]): number | null => {
    const membership = buildGroupMembership(items);

    let index = 0;

    while (index < items.length) {
        const group = membership[index];

        if (!group) {
            if (items[index].eligible) return index;
            index += 1;
            continue;
        }

        const start = index - group.position;
        const end = start + group.size - 1;

        let best = -1;
        for (let member = start; member <= end; member += 1) {
            if (!items[member].eligible) continue;
            if (best === -1 || items[member].completedSets < items[best].completedSets) {
                best = member;
            }
        }

        if (best !== -1) return best;

        // Grupo inteiro concluído ou pulado: segue para depois dele.
        index = end + 1;
    }

    return null;
};

export const buildGroupMembership = (
    items: readonly GroupableExercise[]
): (GroupMembership | null)[] => {
    const membership: (GroupMembership | null)[] = items.map(() => null);

    for (const run of findExerciseGroups(items)) {
        run.indexes.forEach((itemIndex, position) => {
            membership[itemIndex] = {
                groupKey: run.groupKey,
                groupType: run.groupType,
                position,
                size: run.indexes.length,
                isFirst: position === 0,
                isLast: position === run.indexes.length - 1,
            };
        });
    }

    return membership;
};
