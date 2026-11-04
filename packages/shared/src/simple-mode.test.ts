import { describe, expect, it } from "vitest";
import { effectiveLoad, effectiveVolume } from "./effective-load";
import { summarizeSessionRecords } from "./records";
import { calculateAverageRPE, calculateSessionSummary } from "./session";
import { calculateTotalVolume, externalLoad, setVolume } from "./volume";

const noWeight = { actualWeight: null, actualReps: 10 };

describe("série sem peso informado (modo simplificado)", () => {
    it("não acrescenta nada aos totais", () => {
        expect(externalLoad(noWeight)).toBe(0);
        expect(setVolume(noWeight)).toBe(0);
        expect(calculateTotalVolume([noWeight, { actualWeight: 40, actualReps: 10 }])).toBe(400);
    });

    it("tem carga efetiva desconhecida, não zero", () => {
        expect(effectiveLoad(noWeight, { loadType: "EXTERNAL" }, 80)).toBeNull();
        expect(effectiveLoad(noWeight, { loadType: "BODYWEIGHT_LOADED" }, 80)).toBeNull();
        expect(effectiveLoad(noWeight, { loadType: "ASSISTED" }, 80)).toBeNull();
        expect(effectiveVolume(noWeight, { loadType: "EXTERNAL" }, 80)).toBeNull();
    });

    it("continua lendo o peso corporal quando o exercício não usa carga externa", () => {
        expect(effectiveLoad(noWeight, { loadType: "BODYWEIGHT" }, 80)).toBe(80);
    });

    it("distingue 0 kg de peso não informado", () => {
        const zero = { actualWeight: 0, actualReps: 10 };

        expect(effectiveLoad(zero, { loadType: "EXTERNAL" }, 80)).toBe(0);
        expect(effectiveLoad(zero, { loadType: "ASSISTED" }, 80)).toBe(80);
    });

    it("não gera recorde", () => {
        const sets = [{ ...noWeight, exerciseId: 1, exercise: { loadType: "EXTERNAL" as const } }];

        expect(summarizeSessionRecords(sets, 80)[1]).toEqual({ maxLoad: null, sessionVolume: null });
    });

    it("com peso informado também não gera recorde, porque as reps são presumidas", () => {
        const sets = [{
            actualWeight: 500,
            actualReps: 10,
            exerciseId: 1,
            excludedFromRecords: true,
            exercise: { loadType: "EXTERNAL" as const },
        }];

        expect(summarizeSessionRecords(sets, 80)[1]).toBeUndefined();
    });
});

describe("série sem RPE informado", () => {
    it("fica fora da média", () => {
        expect(calculateAverageRPE([{ rpe: 8 }, { rpe: null }, { rpe: 10 }])).toBe(9);
    });

    it("sem nenhum RPE, a média é 0", () => {
        expect(calculateAverageRPE([{ rpe: null }, { rpe: null }])).toBe(0);
    });

    it("não quebra o resumo da sessão", () => {
        const summary = calculateSessionSummary({
            sessionSet: [
                { exerciseId: 1, actualWeight: null, actualReps: 10, rpe: null },
                { exerciseId: 2, actualWeight: 20, actualReps: 10, rpe: null },
            ],
        });

        expect(summary).toMatchObject({ totalVolume: 200, avgRpe: 0, totalSets: 2, exerciseCount: 2 });
    });
});
