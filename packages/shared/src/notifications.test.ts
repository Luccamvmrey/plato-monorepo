import { describe, expect, it } from "vitest";
import { isoWeekKey, mondayOfDateStr, toLocalDateStr, toLocalHour } from "./dates";
import {
    decideNotification,
    habitualHour,
    monthlyPeriod,
    reminderMessage,
    summarizePeriod,
    summaryMessage,
    weeklyPeriod,
    type NotificationDecisionInput,
} from "./notifications";

const SP = "America/Sao_Paulo";

/** Instante em São Paulo (UTC-3), para os testes lerem como o usuário vê. */
const sp = (date: string, hour = 18) => new Date(`${date}T${String(hour).padStart(2, "0")}:00:00-03:00`);

const input = (overrides: Partial<NotificationDecisionInput>): NotificationDecisionInput => ({
    // Quarta-feira, fora de domingo e de dia 1º.
    now: sp("2026-11-04"),
    timezone: SP,
    reminderHour: 18,
    remindersEnabled: true,
    summariesEnabled: true,
    completedAt: [],
    openSessionStartedAt: null,
    sentPushes: [],
    ...overrides,
});

describe("datas locais", () => {
    it("usa o dia do usuário, não o de UTC, depois das 21h em São Paulo", () => {
        const night = sp("2026-11-04", 22);

        expect(night.toISOString().startsWith("2026-11-05")).toBe(true);
        expect(toLocalDateStr(night, SP)).toBe("2026-11-04");
        expect(toLocalHour(night, SP)).toBe(22);
    });

    it("devolve hora 0 à meia-noite, nunca 24", () => {
        expect(toLocalHour(sp("2026-11-04", 0), SP)).toBe(0);
    });

    it("calcula a semana ISO, inclusive na virada de ano", () => {
        expect(isoWeekKey("2026-11-04")).toBe("2026-W45");
        expect(isoWeekKey("2026-11-08")).toBe("2026-W45");
        expect(isoWeekKey("2027-01-01")).toBe("2026-W53");
    });

    it("acha a segunda da semana a partir do domingo", () => {
        expect(mondayOfDateStr("2026-11-08")).toBe("2026-11-02");
        expect(mondayOfDateStr("2026-11-02")).toBe("2026-11-02");
    });
});

describe("habitualHour", () => {
    it("usa 18h com menos de 4 sessões", () => {
        expect(habitualHour([sp("2026-11-01", 7), sp("2026-11-02", 7), sp("2026-11-03", 7)], SP)).toBe(18);
    });

    it("usa a mediana no fuso do usuário", () => {
        const startedAt = [sp("2026-11-01", 7), sp("2026-11-02", 7), sp("2026-11-03", 7), sp("2026-11-04", 20)];

        expect(habitualHour(startedAt, SP)).toBe(7);
    });

    it("não sugere horário fora da faixa permitida", () => {
        const dawn = Array.from({ length: 4 }, (_, i) => sp(`2026-11-0${i + 1}`, 4));
        const night = Array.from({ length: 4 }, (_, i) => sp(`2026-11-0${i + 1}`, 23));

        expect(habitualHour(dawn, SP)).toBe(6);
        expect(habitualHour(night, SP)).toBe(22);
    });
});

describe("decideNotification: lembrete", () => {
    it("não envia fora da hora escolhida", () => {
        const decision = decideNotification(input({
            now: sp("2026-11-04", 19),
            completedAt: [sp("2026-10-20")],
        }));

        expect(decision).toBeNull();
    });

    it("envia todo dia de segunda a sexta, inclusive um dia depois de um treino", () => {
        // 02/11/2026 é segunda-feira.
        for (const date of ["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06"]) {
            expect(decideNotification(input({ now: sp(date), completedAt: [sp("2026-11-01")] }))).toEqual({
                kind: "REMINDER",
                periodKey: date,
            });
        }
    });

    it("não envia lembrete no sábado nem no domingo", () => {
        const completedAt = [sp("2026-10-20")];

        expect(decideNotification(input({ now: sp("2026-11-07"), completedAt }))).toBeNull();
        expect(decideNotification(input({ now: sp("2026-11-08"), completedAt }))).toBeNull();
    });

    it("usa o dia da semana do usuário, não o de UTC", () => {
        // Sexta às 22h em São Paulo já é sábado em UTC.
        const now = sp("2026-11-06", 22);

        expect(decideNotification(input({ now, reminderHour: 22 }))?.kind).toBe("REMINDER");
    });

    it("lembra quem nunca treinou", () => {
        expect(decideNotification(input({}))?.kind).toBe("REMINDER");
    });

    it("não envia se a pessoa já treinou hoje", () => {
        const completedAt = [sp("2026-10-01"), sp("2026-11-04", 7)];

        expect(decideNotification(input({ completedAt }))).toBeNull();
    });

    it("não envia com sessão aberta há menos de 6h, mas ignora sessão abandonada", () => {
        const completedAt = [sp("2026-10-20")];

        expect(decideNotification(input({ completedAt, openSessionStartedAt: sp("2026-11-04", 15) }))).toBeNull();
        expect(decideNotification(input({ completedAt, openSessionStartedAt: sp("2026-10-30", 15) }))?.kind).toBe("REMINDER");
    });

    it("não para depois de vários lembretes sem resposta", () => {
        const sentPushes = ["2026-10-28", "2026-10-29", "2026-10-30", "2026-11-02", "2026-11-03"].map((date) => ({
            createdAt: sp(date),
        }));

        expect(decideNotification(input({ completedAt: [sp("2026-10-01")], sentPushes }))?.kind).toBe("REMINDER");
    });

    it("respeita lembretes desligados", () => {
        expect(decideNotification(input({ remindersEnabled: false, completedAt: [sp("2026-10-01")] }))).toBeNull();
    });
});

describe("decideNotification: resumos e limite diário", () => {
    // 08/11/2026 é domingo; 01/11/2026 é domingo e dia 1º.
    it("envia o resumo semanal no domingo, se houve treino na semana", () => {
        const decision = decideNotification(input({
            now: sp("2026-11-08"),
            completedAt: [sp("2026-11-03")],
        }));

        expect(decision).toEqual({ kind: "WEEKLY_SUMMARY", periodKey: "2026-W45" });
    });

    it("não envia nada no domingo sem treino na semana", () => {
        const decision = decideNotification(input({
            now: sp("2026-11-08"),
            completedAt: [sp("2026-10-20")],
        }));

        expect(decision).toBeNull();
    });

    it("no dia 1º em dia útil, o mensal ocupa o lugar do lembrete; sem treino, vale o lembrete", () => {
        // 01/12/2026 é terça-feira.
        const now = sp("2026-12-01");

        expect(decideNotification(input({ now, completedAt: [sp("2026-11-20")] }))).toEqual({
            kind: "MONTHLY_SUMMARY",
            periodKey: "2026-11",
        });
        expect(decideNotification(input({ now, completedAt: [sp("2026-10-20")] }))?.kind).toBe("REMINDER");
    });

    it("dá prioridade ao mensal quando coincide com o semanal", () => {
        const decision = decideNotification(input({
            now: sp("2026-11-01"),
            completedAt: [sp("2026-10-30")],
        }));

        expect(decision).toEqual({ kind: "MONTHLY_SUMMARY", periodKey: "2026-10" });
    });

    it("não envia nada além de um push por dia", () => {
        const decision = decideNotification(input({
            now: sp("2026-11-08", 18),
            completedAt: [sp("2026-11-03")],
            sentPushes: [{ createdAt: sp("2026-11-08", 7) }],
        }));

        expect(decision).toBeNull();
    });

    it("respeita resumos desligados", () => {
        const decision = decideNotification(input({
            now: sp("2026-11-08"),
            summariesEnabled: false,
            completedAt: [sp("2026-11-07")],
        }));

        expect(decision).toBeNull();
    });
});

describe("períodos", () => {
    it("o semanal vai da segunda até hoje", () => {
        expect(weeklyPeriod("2026-11-08")).toEqual({ from: "2026-11-02", to: "2026-11-08", periodKey: "2026-W45" });
    });

    it("o mensal cobre o mês anterior, inclusive na virada de ano", () => {
        expect(monthlyPeriod("2026-11-01")).toEqual({ from: "2026-10-01", to: "2026-10-31", periodKey: "2026-10" });
        expect(monthlyPeriod("2027-01-01")).toEqual({ from: "2026-12-01", to: "2026-12-31", periodKey: "2026-12" });
    });
});

describe("summarizePeriod", () => {
    const set = (actualWeight: number | null, excludedFromRecords = false) => ({
        actualWeight,
        actualReps: 10,
        equipmentWeight: null,
        excludedFromRecords,
    });

    it("soma só séries válidas do modo completo", () => {
        const summary = summarizePeriod(
            [
                { trackingMode: "FULL", sessionSet: [set(50), set(1000, true)] },
                { trackingMode: "SIMPLE", sessionSet: [set(80, true)] },
            ],
            []
        );

        expect(summary).toEqual({ sessions: 2, volume: 500, records: 0 });
    });

    it("conta recorde por exercício, não por linha", () => {
        expect(summarizePeriod([], [1, 1, 2]).records).toBe(2);
    });
});

describe("textos", () => {
    it("cita o próximo treino quando há programa", () => {
        expect(reminderMessage(3, "Treino B")).toEqual({
            title: "Faz 3 dias desde o último treino",
            body: "Próximo: Treino B",
        });
    });

    it("funciona sem programa e sem nenhum treino", () => {
        expect(reminderMessage(3, null).body).toBe("Quando quiser, seus treinos estão aqui");
        expect(reminderMessage(null, null).title).toBe("Seu primeiro treino está esperando");
    });

    it("monta o resumo em português, com plural certo", () => {
        const { title, body } = summaryMessage("WEEKLY_SUMMARY", { sessions: 3, volume: 12400.4, records: 2 });

        expect(title).toBe("Sua semana");
        expect(body).toBe("3 treinos · 12.400 kg · 2 recordes");
        expect(summaryMessage("MONTHLY_SUMMARY", { sessions: 1, volume: 500, records: 1 }).body).toBe("1 treino · 500 kg · 1 recorde");
    });

    it("omite o volume em vez de mostrar 0 kg", () => {
        expect(summaryMessage("WEEKLY_SUMMARY", { sessions: 2, volume: 0, records: 0 }).body).toBe("2 treinos");
    });
});
