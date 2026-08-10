import { describe, expect, it } from "vitest";
import { calculateSetVolume, calculateTotalVolume, externalLoad, setVolume } from "./volume";

describe("externalLoad", () => {
    it("soma o peso da barra à carga", () => {
        expect(externalLoad({ actualWeight: 40, actualReps: 10, equipmentWeight: 20 })).toBe(60);
    });

    it("trata equipmentWeight ausente como 0", () => {
        expect(externalLoad({ actualWeight: 40, actualReps: 10 })).toBe(40);
    });

    it("trata equipmentWeight null como 0", () => {
        expect(externalLoad({ actualWeight: 40, actualReps: 10, equipmentWeight: null })).toBe(40);
    });

    // Regressão: peso corporal e máquina assistida registram 0 kg legítimo. Guarda
    // de truthiness (`weight || fallback`) já engoliu esse valor quatro vezes neste
    // projeto — ver Do-Not-Repeat de 2026-08-05.
    it("preserva 0 kg como carga legítima", () => {
        expect(externalLoad({ actualWeight: 0, actualReps: 12 })).toBe(0);
    });

    it("preserva 0 kg de barra sem descartar a carga", () => {
        expect(externalLoad({ actualWeight: 30, actualReps: 8, equipmentWeight: 0 })).toBe(30);
    });

    it("aceita meia-casa decimal", () => {
        expect(externalLoad({ actualWeight: 82.5, actualReps: 5 })).toBe(82.5);
    });
});

describe("calculateSetVolume", () => {
    it("multiplica carga somada pelas repetições", () => {
        expect(calculateSetVolume(40, 10, 20)).toBe(600);
    });

    it("usa 0 como default de equipmentWeight", () => {
        expect(calculateSetVolume(40, 10)).toBe(400);
    });

    it("devolve 0 para série de peso corporal sem lastro", () => {
        expect(calculateSetVolume(0, 15)).toBe(0);
    });
});

describe("setVolume", () => {
    it("inclui a barra no volume da série", () => {
        expect(setVolume({ actualWeight: 40, actualReps: 10, equipmentWeight: 20 })).toBe(600);
    });

    it("ignora barra ausente", () => {
        expect(setVolume({ actualWeight: 50, actualReps: 6 })).toBe(300);
    });
});

describe("calculateTotalVolume", () => {
    it("soma o volume de todas as séries", () => {
        const sets = [
            { actualWeight: 40, actualReps: 10, equipmentWeight: 20 },
            { actualWeight: 45, actualReps: 8, equipmentWeight: 20 },
        ];

        expect(calculateTotalVolume(sets)).toBe(600 + 520);
    });

    it("devolve 0 para lista vazia", () => {
        expect(calculateTotalVolume([])).toBe(0);
    });

    it("mistura séries com e sem barra", () => {
        const sets = [
            { actualWeight: 60, actualReps: 5 },
            { actualWeight: 0, actualReps: 12 },
            { actualWeight: 20, actualReps: 10, equipmentWeight: 20 },
        ];

        expect(calculateTotalVolume(sets)).toBe(300 + 0 + 400);
    });
});
