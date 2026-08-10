import { describe, expect, it } from "vitest";
import { calculateE1RM } from "./e1rm";

describe("calculateE1RM", () => {
    it("com RPE 10 (RIR 0) aplica Brzycki puro", () => {
        // reps ajustadas = 5 + 0 = 5 -> 100 * (36 / 32)
        expect(calculateE1RM(100, 5, 10)).toBeCloseTo(112.5, 5);
    });

    it("com RPE 8 adiciona 2 repetições em reserva", () => {
        // reps ajustadas = 5 + 2 = 7 -> 100 * (36 / 30)
        expect(calculateE1RM(100, 5, 8)).toBeCloseTo(120, 5);
    });

    it("uma única repetição a RPE 10 devolve a própria carga", () => {
        // reps ajustadas = 1 -> 100 * (36 / 36)
        expect(calculateE1RM(100, 1, 10)).toBeCloseTo(100, 5);
    });

    it("soma o peso da barra antes de estimar", () => {
        expect(calculateE1RM(80, 5, 10, 20)).toBeCloseTo(112.5, 5);
    });

    it("limita as repetições ajustadas em 36 para não estourar a singularidade", () => {
        // reps 40 + RIR 5 = 45, teto em 36 -> 100 * (36 / 1)
        const result = calculateE1RM(100, 40, 5);

        expect(Number.isFinite(result)).toBe(true);
        expect(result).toBeCloseTo(3600, 5);
    });

    it("devolve 0 para série de peso corporal sem lastro", () => {
        expect(calculateE1RM(0, 10, 8)).toBe(0);
    });
});
