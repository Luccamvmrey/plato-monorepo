import { describe, expect, it } from "vitest";
import { restoreDraftSets } from "./session-draft";

const set = (overrides: Record<string, unknown> = {}) => ({
    workoutSessionId: 7,
    exerciseId: 48,
    setNumber: 1,
    actualReps: 10,
    actualWeight: 60,
    rpe: 8,
    ...overrides,
});

describe("restoreDraftSets", () => {
    it("devolve as séries do rascunho da sessão", () => {
        expect(restoreDraftSets([set(), set({ setNumber: 2, userObservation: "ok" })], 7)).toEqual([
            set(),
            set({ setNumber: 2, userObservation: "ok" }),
        ]);
    });

    it("aceita série do modo simples, sem carga nem RPE", () => {
        expect(restoreDraftSets([set({ actualWeight: null, rpe: null })], 7)).toHaveLength(1);
    });

    it("descarta série de outra sessão ou com forma estranha", () => {
        expect(restoreDraftSets([
            set({ workoutSessionId: 8 }),
            set({ exerciseId: "48" }),
            set({ setNumber: 0 }),
            null,
            "x",
        ], 7)).toEqual([]);
    });

    it("rascunho vazio ou ausente vira lista vazia", () => {
        expect(restoreDraftSets(null, 7)).toEqual([]);
        expect(restoreDraftSets({}, 7)).toEqual([]);
    });
});
