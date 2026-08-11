import { describe, expect, it } from "vitest";
import { resolveBodyWeightAt } from "./body-weight";

const logs = [
    { weight: 70, measuredAt: "2026-01-01T00:00:00Z" },
    { weight: 68, measuredAt: "2026-03-01T00:00:00Z" },
    { weight: 65, measuredAt: "2026-06-01T00:00:00Z" },
];

describe("resolveBodyWeightAt", () => {
    it("usa o registro mais recente anterior à data", () => {
        expect(resolveBodyWeightAt(logs, "2026-04-15T00:00:00Z")).toBe(68);
    });

    it("usa o registro exato quando a data bate", () => {
        expect(resolveBodyWeightAt(logs, "2026-03-01T00:00:00Z")).toBe(68);
    });

    it("usa o último registro para datas posteriores a todos", () => {
        expect(resolveBodyWeightAt(logs, "2026-08-10T00:00:00Z")).toBe(65);
    });

    // Caso da série antiga: o usuário só começou a registrar peso depois.
    it("cai no mais próximo POSTERIOR quando não há nenhum anterior", () => {
        expect(resolveBodyWeightAt(logs, "2025-12-01T00:00:00Z")).toBe(70);
    });

    it("devolve null quando não há registro nenhum", () => {
        expect(resolveBodyWeightAt([], "2026-04-15T00:00:00Z")).toBeNull();
    });

    it("devolve null quando a data é nula", () => {
        expect(resolveBodyWeightAt(logs, null)).toBeNull();
    });

    it("devolve null quando a data é inválida", () => {
        expect(resolveBodyWeightAt(logs, "não é data")).toBeNull();
    });

    it("não depende da ordem da lista", () => {
        const shuffled = [logs[2], logs[0], logs[1]];

        expect(resolveBodyWeightAt(shuffled, "2026-04-15T00:00:00Z")).toBe(68);
    });

    it("aceita Date além de string", () => {
        const asDates = logs.map(l => ({ ...l, measuredAt: new Date(l.measuredAt) }));

        expect(resolveBodyWeightAt(asDates, new Date("2026-04-15T00:00:00Z"))).toBe(68);
    });

    it("com um único registro, devolve ele para qualquer data", () => {
        const single = [{ weight: 72, measuredAt: "2026-05-01T00:00:00Z" }];

        expect(resolveBodyWeightAt(single, "2020-01-01T00:00:00Z")).toBe(72);
        expect(resolveBodyWeightAt(single, "2030-01-01T00:00:00Z")).toBe(72);
    });
});
