import { describe, expect, it } from "vitest";
import {
    estimateSessionsPerWeek,
    findSinglePointMuscles,
    summarizePlannedVolume,
    weeklyExposures,
} from "./planned-volume";
import type { PlannedWorkout } from "./types";

const workout = (
    id: number,
    name: string,
    exercises: Array<[string, number]>
): PlannedWorkout => ({
    id,
    name,
    exercises: exercises.map(([targetMuscle, targetSets]) => ({ targetMuscle, targetSets })),
});

describe("summarizePlannedVolume", () => {
    it("soma séries do mesmo grupo dentro de um treino", () => {
        const result = summarizePlannedVolume([
            workout(1, "Push", [["CHEST", 4], ["CHEST", 3], ["TRICEPS", 3]]),
        ]);

        expect(result).toEqual([
            { muscle: "CHEST", sets: 7, workoutIds: [1] },
            { muscle: "TRICEPS", sets: 3, workoutIds: [1] },
        ]);
    });

    it("soma entre treinos e registra quem atinge cada grupo", () => {
        const result = summarizePlannedVolume([
            workout(1, "A", [["CHEST", 4]]),
            workout(2, "B", [["CHEST", 3], ["BACK", 5]]),
        ]);

        expect(result).toEqual([
            { muscle: "CHEST", sets: 7, workoutIds: [1, 2] },
            { muscle: "BACK", sets: 5, workoutIds: [2] },
        ]);
    });

    it("não conta o mesmo treino duas vezes quando ele repete o grupo", () => {
        const [chest] = summarizePlannedVolume([
            workout(9, "Peito dobrado", [["CHEST", 3], ["CHEST", 3], ["CHEST", 3]]),
        ]);

        expect(chest.workoutIds).toEqual([9]);
        expect(chest.sets).toBe(9);
    });

    it("ordena por séries desc e desempata pelo nome do grupo", () => {
        const result = summarizePlannedVolume([
            workout(1, "A", [["TRICEPS", 6], ["BICEPS", 6], ["SHOULDERS", 9]]),
        ]);

        expect(result.map((entry) => entry.muscle)).toEqual(["SHOULDERS", "BICEPS", "TRICEPS"]);
    });

    // O campo numérico do editor entrega NaN enquanto está vazio. Somar NaN
    // contaminaria o total do grupo inteiro e o painel mostraria "NaN séries".
    it("trata targetSets NaN como 0 sem perder a presença do grupo", () => {
        const [chest] = summarizePlannedVolume([
            workout(1, "A", [["CHEST", Number.NaN], ["CHEST", 4]]),
        ]);

        expect(chest.sets).toBe(4);
        expect(chest.workoutIds).toEqual([1]);
    });

    // Presença é ter o exercício, não ter série. Do contrário o grupo pisca fora do
    // painel enquanto o usuário apaga o campo para redigitar.
    it("mantém o grupo presente com 0 séries", () => {
        const result = summarizePlannedVolume([workout(1, "A", [["GLUTES", 0]])]);

        expect(result).toEqual([{ muscle: "GLUTES", sets: 0, workoutIds: [1] }]);
    });

    it("devolve lista vazia para conjunto vazio e para treino sem exercício", () => {
        expect(summarizePlannedVolume([])).toEqual([]);
        expect(summarizePlannedVolume([workout(1, "Vazio", [])])).toEqual([]);
    });
});

describe("findSinglePointMuscles", () => {
    const volume = summarizePlannedVolume([
        workout(1, "A", [["CHEST", 6], ["SHOULDERS", 3]]),
        workout(2, "B", [["CHEST", 6], ["BACK", 6]]),
        workout(3, "C", [["GLUTES", 9], ["SHOULDERS", 3]]),
    ]);

    it("acusa só os grupos servidos por um único treino", () => {
        expect(findSinglePointMuscles(volume, 3).map((entry) => entry.muscle).sort())
            .toEqual(["BACK", "GLUTES"]);
    });

    // Caso real medido: GLÚTEO tinha 9 séries planejadas — volume nada baixo — e
    // ainda assim ficou em 0,3 exposição/semana, porque o único treino que o atingia
    // foi feito uma vez. O aviso não é sobre o total.
    it("acusa grupo com muito volume, se ele depender de um treino só", () => {
        const glutes = findSinglePointMuscles(volume, 3).find((e) => e.muscle === "GLUTES");

        expect(glutes?.sets).toBe(9);
    });

    it("não acusa nada quando o conjunto tem um treino só", () => {
        const single = summarizePlannedVolume([workout(1, "A", [["CHEST", 6]])]);

        expect(findSinglePointMuscles(single, 1)).toEqual([]);
    });
});

describe("weeklyExposures", () => {
    it("distribui a cadência entre os treinos do ciclo", () => {
        // 5 treinos a 3,5 sessões/semana: cada treino sai 0,7 vez por semana.
        expect(weeklyExposures(3, 3.5, 5)).toBeCloseTo(2.1);
        expect(weeklyExposures(1, 3.5, 5)).toBeCloseTo(0.7);
    });

    it("devolve 0 para ciclo vazio em vez de dividir por zero", () => {
        expect(weeklyExposures(2, 3.5, 0)).toBe(0);
    });
});

describe("estimateSessionsPerWeek", () => {
    const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);

    it("usa o intervalo coberto, não a largura da janela", () => {
        // 4 sessões em 7 dias = 4/semana, mesmo com janela de 8 semanas.
        const result = estimateSessionsPerWeek([daysAgo(7), daysAgo(5), daysAgo(3), daysAgo(0)]);

        expect(result).toBeCloseTo(4, 1);
    });

    it("devolve null abaixo do mínimo de sinal", () => {
        expect(estimateSessionsPerWeek([daysAgo(3), daysAgo(1)])).toBeNull();
        expect(estimateSessionsPerWeek([])).toBeNull();
    });

    it("ignora sessões fora da janela", () => {
        const antigas = [daysAgo(200), daysAgo(190), daysAgo(180)];
        const recentes = [daysAgo(7), daysAgo(5), daysAgo(3), daysAgo(0)];

        expect(estimateSessionsPerWeek([...antigas, ...recentes])).toBeCloseTo(4, 1);
        expect(estimateSessionsPerWeek(antigas)).toBeNull();
    });

    it("aceita data como string ISO", () => {
        const iso = [daysAgo(7), daysAgo(5), daysAgo(3), daysAgo(0)].map((d) => d.toISOString());

        expect(estimateSessionsPerWeek(iso)).toBeCloseTo(4, 1);
    });

    it("descarta data inválida em vez de propagar NaN", () => {
        const result = estimateSessionsPerWeek([
            "não é data",
            daysAgo(7),
            daysAgo(5),
            daysAgo(3),
            daysAgo(0),
        ]);

        expect(result).toBeCloseTo(4, 1);
    });

    // Um único dia com várias sessões tem span 0. Sem o piso de uma semana isso
    // dividiria por zero e devolveria Infinity.
    it("não estoura quando todas as sessões são no mesmo dia", () => {
        const result = estimateSessionsPerWeek([daysAgo(1), daysAgo(1), daysAgo(1), daysAgo(1)]);

        expect(result).toBe(4);
    });
});
