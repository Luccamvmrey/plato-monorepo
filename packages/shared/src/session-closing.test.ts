import { describe, expect, it } from "vitest";
import { decideOpenSession, normalizeLastSetAt, resolveCompletedAt, shouldSendDraft } from "./session-closing";

const HOUR = 3_600_000;
const NOW = Date.parse("2026-11-07T20:00:00Z");
const hoursAgo = (hours: number) => NOW - hours * HOUR;

describe("decideOpenSession", () => {
    it("nunca mexe em sessão sem rascunho, por mais antiga que seja", () => {
        expect(decideOpenSession({ startedAt: hoursAgo(1000), lastSetAt: null, draftSetCount: null, now: NOW })).toBe("KEEP");
    });

    it("fecha depois de 3h sem série nova, e não antes", () => {
        const input = { startedAt: hoursAgo(10), draftSetCount: 5, now: NOW };

        expect(decideOpenSession({ ...input, lastSetAt: hoursAgo(2.9) })).toBe("KEEP");
        expect(decideOpenSession({ ...input, lastSetAt: hoursAgo(3) })).toBe("CLOSE");
    });

    it("conta a partir do início quando a série não tem horário", () => {
        expect(decideOpenSession({ startedAt: hoursAgo(2), lastSetAt: null, draftSetCount: 5, now: NOW })).toBe("KEEP");
        expect(decideOpenSession({ startedAt: hoursAgo(4), lastSetAt: null, draftSetCount: 5, now: NOW })).toBe("CLOSE");
    });

    it("descarta sessão sem séries só depois de 24h", () => {
        expect(decideOpenSession({ startedAt: hoursAgo(23), lastSetAt: null, draftSetCount: 0, now: NOW })).toBe("KEEP");
        expect(decideOpenSession({ startedAt: hoursAgo(24), lastSetAt: null, draftSetCount: 0, now: NOW })).toBe("DISCARD");
    });
});

describe("shouldSendDraft", () => {
    it("sempre envia quando o aparelho tem séries, mesmo em sessão antiga", () => {
        expect(shouldSendDraft(1, hoursAgo(500), NOW)).toBe(true);
    });

    it("envia rascunho vazio em sessão recente", () => {
        expect(shouldSendDraft(0, hoursAgo(1), NOW)).toBe(true);
    });

    it("não envia rascunho vazio em sessão antiga: as séries podem estar em outro aparelho", () => {
        expect(shouldSendDraft(0, hoursAgo(3), NOW)).toBe(false);
        expect(shouldSendDraft(0, hoursAgo(500), NOW)).toBe(false);
    });
});

describe("normalizeLastSetAt", () => {
    const startedAt = hoursAgo(2);

    it("mantém um horário válido", () => {
        expect(normalizeLastSetAt(hoursAgo(1), startedAt, NOW)).toBe(hoursAgo(1));
    });

    it("corrige relógio errado do aparelho para dentro do treino", () => {
        expect(normalizeLastSetAt(hoursAgo(50), startedAt, NOW)).toBe(startedAt);
        expect(normalizeLastSetAt(NOW + HOUR, startedAt, NOW)).toBe(NOW);
    });

    it("não inventa horário", () => {
        expect(normalizeLastSetAt(null, startedAt, NOW)).toBeNull();
        expect(normalizeLastSetAt(undefined, startedAt, NOW)).toBeNull();
    });
});

describe("resolveCompletedAt", () => {
    it("usa agora em quem conclui logo depois de treinar", () => {
        expect(resolveCompletedAt(hoursAgo(1), hoursAgo(0.1), NOW)).toBe(NOW);
    });

    it("usa a última série em quem conclui muito depois", () => {
        expect(resolveCompletedAt(hoursAgo(30), hoursAgo(29), NOW)).toBe(hoursAgo(29));
    });

    it("usa o início quando não há horário de série e já passou muito tempo", () => {
        expect(resolveCompletedAt(hoursAgo(30), null, NOW)).toBe(hoursAgo(30));
    });

    it("usa agora em treino recente sem horário de série", () => {
        expect(resolveCompletedAt(hoursAgo(1), null, NOW)).toBe(NOW);
    });
});
