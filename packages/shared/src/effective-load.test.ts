import { describe, expect, it } from "vitest";
import { effectiveLoad, effectiveVolume } from "./effective-load";

const set = (actualWeight: number, actualReps = 10, equipmentWeight?: number | null) =>
    ({ actualWeight, actualReps, equipmentWeight });

const BW = 65;

describe("effectiveLoad — EXTERNAL", () => {
    it("devolve a carga externa", () => {
        expect(effectiveLoad(set(80), { loadType: "EXTERNAL" }, BW)).toBe(80);
    });

    it("soma o peso da barra", () => {
        expect(effectiveLoad(set(40, 10, 20), { loadType: "EXTERNAL" }, BW)).toBe(60);
    });

    it("não precisa de peso corporal", () => {
        expect(effectiveLoad(set(80), { loadType: "EXTERNAL" }, null)).toBe(80);
    });
});

describe("effectiveLoad — BODYWEIGHT", () => {
    it("é o peso corporal, ignorando actualWeight", () => {
        expect(effectiveLoad(set(0), { loadType: "BODYWEIGHT" }, BW)).toBe(65);
    });

    it("devolve null sem peso corporal", () => {
        expect(effectiveLoad(set(0), { loadType: "BODYWEIGHT" }, null)).toBeNull();
    });
});

describe("effectiveLoad — BODYWEIGHT_LOADED", () => {
    it("soma o lastro ao peso corporal", () => {
        expect(effectiveLoad(set(10), { loadType: "BODYWEIGHT_LOADED" }, BW)).toBe(75);
    });

    // Caso das Paralelas sem lastro: 0 kg é legítimo e não pode virar null.
    it("sem lastro devolve o próprio peso corporal", () => {
        expect(effectiveLoad(set(0), { loadType: "BODYWEIGHT_LOADED" }, BW)).toBe(65);
    });

    it("devolve null sem peso corporal", () => {
        expect(effectiveLoad(set(10), { loadType: "BODYWEIGHT_LOADED" }, null)).toBeNull();
    });
});

describe("effectiveLoad — ASSISTED", () => {
    it("subtrai a assistência do peso corporal", () => {
        expect(effectiveLoad(set(20), { loadType: "ASSISTED" }, BW)).toBe(45);
    });

    // A propriedade que elimina o ramo invertido: menos assistência = carga maior.
    it("menos assistência produz carga MAIOR", () => {
        const muita = effectiveLoad(set(40), { loadType: "ASSISTED" }, BW)!;
        const pouca = effectiveLoad(set(10), { loadType: "ASSISTED" }, BW)!;

        expect(pouca).toBeGreaterThan(muita);
    });

    it("sem assistência nenhuma equivale ao peso corporal", () => {
        expect(effectiveLoad(set(0), { loadType: "ASSISTED" }, BW)).toBe(65);
    });

    it("devolve null sem peso corporal", () => {
        expect(effectiveLoad(set(20), { loadType: "ASSISTED" }, null)).toBeNull();
    });
});

describe("effectiveLoad — o caso real das Paralelas", () => {
    // Antes de 06/07/2026 as séries eram no graviton (assistência); depois, peso
    // corporal puro. Com actualWeight cru, 48 (assistido) parecia MENOS que 65 e a
    // progressão lia isso como evolução. Pela carga efetiva a ordem se inverte.
    it("assistido a 48 kg é MAIS FRACO que peso corporal puro", () => {
        const assistido = effectiveLoad(set(48), { loadType: "ASSISTED" }, BW)!;
        const corporal = effectiveLoad(set(0), { loadType: "BODYWEIGHT_LOADED" }, BW)!;

        expect(assistido).toBe(17);
        expect(corporal).toBe(65);
        expect(corporal).toBeGreaterThan(assistido);
    });
});

describe("effectiveVolume", () => {
    it("multiplica carga efetiva por repetições", () => {
        expect(effectiveVolume(set(10, 8), { loadType: "BODYWEIGHT_LOADED" }, BW)).toBe(75 * 8);
    });

    it("devolve null para exercício medido em segundos", () => {
        const plank = { loadType: "BODYWEIGHT" as const, repUnit: "SECONDS" as const };

        expect(effectiveVolume(set(0, 60), plank, BW)).toBeNull();
    });

    it("devolve null quando a carga efetiva é indefinida", () => {
        expect(effectiveVolume(set(0, 12), { loadType: "BODYWEIGHT" }, null)).toBeNull();
    });

    it("conta volume normal para EXTERNAL com barra", () => {
        expect(effectiveVolume(set(40, 10, 20), { loadType: "EXTERNAL" }, null)).toBe(600);
    });
});
