import { describe, expect, it } from "vitest";
import { summarizeSessionRecords, type RecordCandidateSet } from "./records";

const EXTERNAL = { loadType: "EXTERNAL" as const };
const DIPS = { loadType: "BODYWEIGHT_LOADED" as const };
const PLANK = { loadType: "BODYWEIGHT" as const, repUnit: "SECONDS" as const };

const mk = (over: Partial<RecordCandidateSet> = {}): RecordCandidateSet => ({
    exerciseId: 1,
    actualWeight: 50,
    actualReps: 10,
    equipmentWeight: null,
    exercise: EXTERNAL,
    ...over,
});

describe("summarizeSessionRecords", () => {
    it("WEIGHT é a maior carga da sessão", () => {
        const stats = summarizeSessionRecords([
            mk({ actualWeight: 40 }),
            mk({ actualWeight: 60 }),
            mk({ actualWeight: 50 }),
        ], null);

        expect(stats[1].maxLoad).toBe(60);
    });

    it("VOLUME soma TODAS as séries do exercício, não só a mais pesada", () => {
        const stats = summarizeSessionRecords([
            mk({ actualWeight: 40, actualReps: 10 }),
            mk({ actualWeight: 60, actualReps: 5 }),
        ], null);

        expect(stats[1].sessionVolume).toBe(400 + 300);
    });

    it("separa por exercício", () => {
        const stats = summarizeSessionRecords([
            mk({ exerciseId: 1, actualWeight: 40 }),
            mk({ exerciseId: 2, actualWeight: 90 }),
        ], null);

        expect(stats[1].maxLoad).toBe(40);
        expect(stats[2].maxLoad).toBe(90);
    });

    it("ignora série marcada como excluída", () => {
        const stats = summarizeSessionRecords([
            mk({ actualWeight: 50 }),
            mk({ actualWeight: 1000, excludedFromRecords: true }),
        ], null);

        expect(stats[1].maxLoad).toBe(50);
        expect(stats[1].sessionVolume).toBe(500);
    });

    it("usa peso corporal em exercício de peso corporal", () => {
        const stats = summarizeSessionRecords(
            [mk({ exercise: DIPS, actualWeight: 0, actualReps: 8 })],
            65
        );

        expect(stats[1].maxLoad).toBe(65);
        expect(stats[1].sessionVolume).toBe(65 * 8);
    });

    // Sem peso corporal registrado a carga é indefinida: o exercício aparece no mapa
    // mas sem valores, e o chamador não grava PR nenhum.
    it("devolve null quando o peso corporal é desconhecido", () => {
        const stats = summarizeSessionRecords(
            [mk({ exercise: DIPS, actualWeight: 0 })],
            null
        );

        expect(stats[1].maxLoad).toBeNull();
        expect(stats[1].sessionVolume).toBeNull();
    });

    it("exercício em segundos tem carga mas não tem volume", () => {
        const stats = summarizeSessionRecords(
            [mk({ exercise: PLANK, actualWeight: 0, actualReps: 60 })],
            65
        );

        expect(stats[1].maxLoad).toBe(65);
        expect(stats[1].sessionVolume).toBeNull();
    });

    it("séries de 0 kg contam como dado real, não como ausência", () => {
        const stats = summarizeSessionRecords([mk({ actualWeight: 0, actualReps: 12 })], null);

        expect(stats[1].maxLoad).toBe(0);
        expect(stats[1].sessionVolume).toBe(0);
    });

    it("sessão sem séries devolve mapa vazio", () => {
        expect(summarizeSessionRecords([], 65)).toEqual({});
    });
});
