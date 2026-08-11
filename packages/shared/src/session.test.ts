import { describe, expect, it } from "vitest";
import { calculateAverageRPE, calculateSessionDuration, calculateSessionSummary } from "./session";

describe("calculateAverageRPE", () => {
    it("calcula a média", () => {
        expect(calculateAverageRPE([{ rpe: 8 }, { rpe: 10 }])).toBe(9);
    });

    it("devolve 0 para lista vazia em vez de NaN", () => {
        expect(calculateAverageRPE([])).toBe(0);
    });
});

describe("calculateSessionDuration", () => {
    it("mede em segundos", () => {
        const duration = calculateSessionDuration({
            startedAt: new Date("2026-08-10T10:00:00Z"),
            completedAt: new Date("2026-08-10T11:30:00Z"),
        });

        expect(duration).toBe(90 * 60);
    });

    // O backend entrega Date (Prisma) e o frontend recebe string (JSON).
    it("aceita datas em string", () => {
        const duration = calculateSessionDuration({
            startedAt: "2026-08-10T10:00:00Z",
            completedAt: "2026-08-10T10:45:00Z",
        });

        expect(duration).toBe(45 * 60);
    });

    it("devolve 0 quando a sessão não foi concluída", () => {
        expect(calculateSessionDuration({ startedAt: new Date(), completedAt: null })).toBe(0);
    });

    it("devolve 0 quando falta o início", () => {
        expect(calculateSessionDuration({ startedAt: null, completedAt: new Date() })).toBe(0);
    });
});

describe("calculateSessionSummary", () => {
    const session = {
        startedAt: "2026-08-10T10:00:00Z",
        completedAt: "2026-08-10T11:00:00Z",
        sessionSet: [
            { exerciseId: 1, actualWeight: 40, actualReps: 10, equipmentWeight: 20, rpe: 8 },
            { exerciseId: 1, actualWeight: 45, actualReps: 8, equipmentWeight: 20, rpe: 9 },
            { exerciseId: 2, actualWeight: 0, actualReps: 12, rpe: 7 },
        ],
    };

    it("soma o volume incluindo a barra", () => {
        expect(calculateSessionSummary(session).totalVolume).toBe(600 + 520 + 0);
    });

    it("conta exercícios distintos, não séries", () => {
        expect(calculateSessionSummary(session).exerciseCount).toBe(2);
    });

    it("conta o total de séries", () => {
        expect(calculateSessionSummary(session).totalSets).toBe(3);
    });

    it("mede a duração", () => {
        expect(calculateSessionSummary(session).duration).toBe(3600);
    });

    it("sobrevive a sessão sem séries", () => {
        const summary = calculateSessionSummary({ startedAt: null, completedAt: null });

        expect(summary).toEqual({
            totalVolume: 0,
            avgRpe: 0,
            duration: 0,
            totalSets: 0,
            exerciseCount: 0,
        });
    });
});
