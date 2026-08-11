import { describe, expect, it } from "vitest";
import {
    buildGroupMembership,
    findActiveExerciseIndex,
    findExerciseGroups,
    normalizeExerciseGroups,
    type GroupableExercise,
    type RotationItem,
} from "./exercise-groups";

/** `a` = agrupado na chave "a"; `null` = solto. */
const list = (...keys: (string | null)[]): GroupableExercise[] =>
    keys.map((groupKey) => ({ groupKey, groupType: groupKey ? "SUPERSET" : null }));

describe("findExerciseGroups", () => {
    it("acha uma sequência contígua de dois", () => {
        const runs = findExerciseGroups(list(null, "a", "a", null));

        expect(runs).toHaveLength(1);
        expect(runs[0].indexes).toEqual([1, 2]);
        expect(runs[0].groupKey).toBe("a");
    });

    it("acha tri-set e sequências múltiplas", () => {
        const runs = findExerciseGroups(list("a", "a", "a", null, "b", "b"));

        expect(runs.map((run) => run.indexes)).toEqual([[0, 1, 2], [4, 5]]);
    });

    // Chave sozinha é resíduo: o vizinho foi removido ou arrastado para longe.
    it("ignora chave com um membro só", () => {
        expect(findExerciseGroups(list("a", null, "b"))).toEqual([]);
    });

    it("não junta membros da mesma chave que ficaram separados", () => {
        // Arrastar um exercício para o meio parte o grupo: [a, x, a] não é bi-set.
        expect(findExerciseGroups(list("a", null, "a"))).toEqual([]);
    });

    // Determinístico e sem inventar chave nova: a primeira sequência válida fica.
    it("mantém só a primeira sequência quando a chave aparece duas vezes", () => {
        const runs = findExerciseGroups(list("a", "a", null, "a", "a"));

        expect(runs).toHaveLength(1);
        expect(runs[0].indexes).toEqual([0, 1]);
    });

    it("herda o tipo do primeiro membro e cai para SUPERSET sem tipo", () => {
        const items: GroupableExercise[] = [
            { groupKey: "a", groupType: "REST_PAUSE" },
            { groupKey: "a", groupType: "REST_PAUSE" },
            { groupKey: "b", groupType: null },
            { groupKey: "b", groupType: null },
        ];

        expect(findExerciseGroups(items).map((run) => run.groupType))
            .toEqual(["REST_PAUSE", "SUPERSET"]);
    });

    it("trata string vazia como ausência de grupo", () => {
        expect(findExerciseGroups(list("", ""))).toEqual([]);
    });

    it("devolve vazio para lista vazia", () => {
        expect(findExerciseGroups([])).toEqual([]);
    });
});

describe("normalizeExerciseGroups", () => {
    it("limpa a chave órfã e preserva a válida", () => {
        const result = normalizeExerciseGroups(list("a", "a", "b"));

        expect(result.map((item) => item.groupKey)).toEqual(["a", "a", null]);
        expect(result[2].groupType).toBeNull();
    });

    it("dissolve o grupo inteiro quando o reordenamento o parte ao meio", () => {
        const result = normalizeExerciseGroups(list("a", null, "a"));

        expect(result.map((item) => item.groupKey)).toEqual([null, null, null]);
    });

    it("preserva o run maior e dissolve o membro isolado", () => {
        // Tri-set com um membro arrastado para o fim: sobra bi-set válido.
        const result = normalizeExerciseGroups(list("a", "a", null, "a"));

        expect(result.map((item) => item.groupKey)).toEqual(["a", "a", null, null]);
    });

    // Identidade referencial: linha intocada não deve re-renderizar.
    it("devolve a mesma referência para itens que não mudam", () => {
        const items = list("a", "a", "b");
        const result = normalizeExerciseGroups(items);

        expect(result[0]).toBe(items[0]);
        expect(result[1]).toBe(items[1]);
        expect(result[2]).not.toBe(items[2]);
    });

    it("não toca em lista sem nenhum grupo", () => {
        const items = list(null, null);
        const result = normalizeExerciseGroups(items);

        expect(result[0]).toBe(items[0]);
        expect(result[1]).toBe(items[1]);
    });

    it("preserva campos extras do item ao limpar o grupo", () => {
        const items = [{ groupKey: "a", groupType: "SUPERSET", exerciseId: 7 }];
        const [result] = normalizeExerciseGroups(items);

        expect(result).toEqual({ groupKey: null, groupType: null, exerciseId: 7 });
    });
});

describe("buildGroupMembership", () => {
    it("marca primeiro, meio e último do tri-set", () => {
        const membership = buildGroupMembership(list("a", "a", "a"));

        expect(membership.map((m) => m && [m.position, m.isFirst, m.isLast])).toEqual([
            [0, true, false],
            [1, false, false],
            [2, false, true],
        ]);
        expect(membership[0]?.size).toBe(3);
    });

    it("devolve null para quem não está agrupado", () => {
        const membership = buildGroupMembership(list(null, "a", "a"));

        expect(membership[0]).toBeNull();
        expect(membership[1]).not.toBeNull();
    });

    it("num bi-set os dois membros são primeiro e último", () => {
        const membership = buildGroupMembership(list("a", "a"));

        expect(membership[0]?.isFirst).toBe(true);
        expect(membership[0]?.isLast).toBe(false);
        expect(membership[1]?.isFirst).toBe(false);
        expect(membership[1]?.isLast).toBe(true);
    });
});

describe("findActiveExerciseIndex", () => {
    /** `[chave, séries feitas, elegível]` */
    const stack = (...rows: [string | null, number, boolean][]): RotationItem[] =>
        rows.map(([groupKey, completedSets, eligible]) => ({
            groupKey,
            groupType: groupKey ? "SUPERSET" : null,
            completedSets,
            eligible,
        }));

    it("sem grupo, é o primeiro elegível", () => {
        expect(findActiveExerciseIndex(stack([null, 0, true], [null, 0, true]))).toBe(0);
        expect(findActiveExerciseIndex(stack([null, 3, false], [null, 0, true]))).toBe(1);
    });

    // O caso que motivou tudo: 3×Rosca + 3×Extensão em bi-set precisa sair
    // R,E,R,E,R,E — e não R,R,R,E,E,E.
    it("reveza série a série dentro do bi-set", () => {
        const passos: number[] = [];
        const feitas = [0, 0];
        const alvo = 3;

        for (let i = 0; i < alvo * 2; i += 1) {
            const active = findActiveExerciseIndex(stack(
                ["a", feitas[0], feitas[0] < alvo],
                ["a", feitas[1], feitas[1] < alvo],
            ));

            expect(active).not.toBeNull();
            passos.push(active!);
            feitas[active!] += 1;
        }

        expect(passos).toEqual([0, 1, 0, 1, 0, 1]);
        expect(findActiveExerciseIndex(stack(["a", 3, false], ["a", 3, false]))).toBeNull();
    });

    it("reveza num tri-set", () => {
        expect(findActiveExerciseIndex(stack(["a", 0, true], ["a", 0, true], ["a", 0, true]))).toBe(0);
        expect(findActiveExerciseIndex(stack(["a", 1, true], ["a", 0, true], ["a", 0, true]))).toBe(1);
        expect(findActiveExerciseIndex(stack(["a", 1, true], ["a", 1, true], ["a", 0, true]))).toBe(2);
        expect(findActiveExerciseIndex(stack(["a", 1, true], ["a", 1, true], ["a", 1, true]))).toBe(0);
    });

    it("pula o membro inelegível e mantém o rodízio entre os que sobraram", () => {
        // O do meio foi pulado; o revezamento continua entre o primeiro e o terceiro.
        expect(findActiveExerciseIndex(stack(["a", 1, true], ["a", 0, false], ["a", 0, true]))).toBe(2);
        expect(findActiveExerciseIndex(stack(["a", 1, true], ["a", 0, false], ["a", 1, true]))).toBe(0);
    });

    it("segue para depois do grupo quando ele acabou", () => {
        expect(findActiveExerciseIndex(stack(
            ["a", 3, false], ["a", 3, false], [null, 0, true],
        ))).toBe(2);
    });

    // Empate resolve pela ordem: sem isso o "próximo" oscilaria entre renders.
    it("resolve empate pelo primeiro da ordem", () => {
        expect(findActiveExerciseIndex(stack(["a", 2, true], ["a", 2, true]))).toBe(0);
    });

    // Recuperação de estado: uma série gravada fora de ordem não trava o rodízio,
    // porque a vez não é guardada em lugar nenhum — é derivada do atraso.
    it("volta ao membro mais atrasado depois de um estado torto", () => {
        expect(findActiveExerciseIndex(stack(["a", 3, true], ["a", 0, true]))).toBe(1);
    });

    it("devolve null quando nada é elegível, e para lista vazia", () => {
        expect(findActiveExerciseIndex(stack([null, 3, false], ["a", 3, false], ["a", 3, false]))).toBeNull();
        expect(findActiveExerciseIndex([])).toBeNull();
    });

    // Chave órfã não forma grupo, então a linha é tratada como solta.
    it("ignora agrupamento inválido", () => {
        expect(findActiveExerciseIndex(stack(["a", 5, true], [null, 0, true]))).toBe(0);
    });
});
