import {
    addDaysToDateStr,
    daysBetweenDateStrs,
    isoWeekKey,
    mondayOfDateStr,
    toLocalDateStr,
    toLocalHour,
} from "./dates";
import { estimateSessionsPerWeek } from "./planned-volume";
import type { VolumeSet } from "./types";
import { calculateTotalVolume } from "./volume";

export type NotificationKindValue = "REMINDER" | "WEEKLY_SUMMARY" | "MONTHLY_SUMMARY";

export const MIN_REMINDER_HOUR = 6;
export const MAX_REMINDER_HOUR = 22;
export const DEFAULT_REMINDER_HOUR = 18;

/** Abaixo disso a mediana diz mais sobre um dia isolado do que sobre um hábito. */
const MIN_SESSIONS_FOR_HABIT = 4;
const OPEN_SESSION_WINDOW_MS = 6 * 3_600_000;

const DEFAULT_REMINDER_AFTER_DAYS = 3;
const MIN_REMINDER_AFTER_DAYS = 3;
const MAX_REMINDER_AFTER_DAYS = 7;

/** Espera antes do 2º e do 3º lembrete. Depois disso, silêncio até o próximo treino. */
const FOLLOW_UP_WAIT_DAYS = [3, 7];

type DateLike = Date | string;

const toDate = (value: DateLike): Date => new Date(value);

/** Horário sugerido ao ativar: a mediana de quando a pessoa costuma começar a treinar. */
export const habitualHour = (startedAt: readonly DateLike[], timezone: string): number => {
    if (startedAt.length < MIN_SESSIONS_FOR_HABIT) return DEFAULT_REMINDER_HOUR;

    const hours = startedAt
        .map((date) => toLocalHour(toDate(date), timezone))
        .sort((a, b) => a - b);
    const median = hours[Math.floor(hours.length / 2)];

    return Math.min(MAX_REMINDER_HOUR, Math.max(MIN_REMINDER_HOUR, median));
};

/**
 * Quantos dias sem treinar disparam o primeiro lembrete: dois a mais que o intervalo
 * habitual. Com um só, a simulação sobre o histórico real avisava quem treina bem toda
 * semana, e em quase todos os casos a pessoa voltaria em até 48h de qualquer forma.
 */
export const reminderAfterDays = (sessionsPerWeek: number | null): number => {
    if (sessionsPerWeek === null || sessionsPerWeek <= 0) return DEFAULT_REMINDER_AFTER_DAYS;

    const days = Math.round(7 / sessionsPerWeek) + 2;

    return Math.min(MAX_REMINDER_AFTER_DAYS, Math.max(MIN_REMINDER_AFTER_DAYS, days));
};

export interface NotificationDecisionInput {
    now: Date;
    timezone: string;
    reminderHour: number;
    remindersEnabled: boolean;
    summariesEnabled: boolean;
    /** Datas de conclusão de todas as sessões. Usadas para cadência e para os resumos. */
    completedAt: readonly DateLike[];
    /** Início da sessão aberta mais recente, se houver. */
    openSessionStartedAt: DateLike | null;
    /** Última ativação. Reativar não pode disparar lembrete por um treino antigo. */
    activatedAt: DateLike;
    /** Push enviados, com tipo e data. Só precisa cobrir as últimas semanas. */
    sentPushes: readonly { kind: NotificationKindValue; createdAt: DateLike }[];
}

export interface NotificationDecision {
    kind: NotificationKindValue;
    periodKey: string;
}

/** Início e fim, inclusivos, do período resumido, em datas locais. */
export const weeklyPeriod = (today: string) => ({
    from: mondayOfDateStr(today),
    to: today,
    periodKey: isoWeekKey(today),
});

export const monthlyPeriod = (today: string) => {
    const lastDay = addDaysToDateStr(`${today.slice(0, 7)}-01`, -1);

    return { from: `${lastDay.slice(0, 7)}-01`, to: lastDay, periodKey: lastDay.slice(0, 7) };
};

/** No domingo, o resumo semanal está na hora. Também decide o envio por e-mail. */
export const isSunday = (dateStr: string): boolean => mondayOfDateStr(dateStr) === addDaysToDateStr(dateStr, -6);

const decideReminder = (
    { now, timezone, completedAt, openSessionStartedAt, activatedAt, sentPushes }: NotificationDecisionInput,
    today: string
): NotificationDecision | null => {
    if (
        openSessionStartedAt !== null &&
        now.getTime() - toDate(openSessionStartedAt).getTime() < OPEN_SESSION_WINDOW_MS
    ) {
        return null;
    }

    const lastCompletedAt = completedAt.reduce<Date | null>((latest, value) => {
        const date = toDate(value);

        return latest === null || date > latest ? date : latest;
    }, null);

    if (lastCompletedAt !== null && toLocalDateStr(lastCompletedAt, timezone) === today) return null;

    // A contagem parte do que veio por último: quem reativa depois de meses em silêncio
    // não pode receber um lembrete no mesmo dia.
    const activated = toDate(activatedAt);
    const anchor = lastCompletedAt !== null && lastCompletedAt > activated ? lastCompletedAt : activated;

    const reminders = sentPushes
        .filter((push) => push.kind === "REMINDER" && toDate(push.createdAt) > anchor)
        .map((push) => toDate(push.createdAt))
        .sort((a, b) => a.getTime() - b.getTime());

    if (reminders.length > FOLLOW_UP_WAIT_DAYS.length) return null;

    const reference = reminders[reminders.length - 1] ?? anchor;
    const daysSince = daysBetweenDateStrs(toLocalDateStr(reference, timezone), today);
    const wait = reminders.length === 0
        ? reminderAfterDays(estimateSessionsPerWeek(completedAt, 8, now.getTime()))
        : FOLLOW_UP_WAIT_DAYS[reminders.length - 1];

    return daysSince >= wait ? { kind: "REMINDER", periodKey: today } : null;
};

/**
 * O que enviar por push agora, se algo. Prioridade: mensal, semanal, lembrete.
 *
 * Só decide durante a hora escolhida: se a VPS ficar fora do ar, nada sai atrasado de
 * madrugada. O dono do envio único é o índice do `NotificationLog`, não esta função.
 */
export const decideNotification = (input: NotificationDecisionInput): NotificationDecision | null => {
    const { now, timezone, reminderHour, remindersEnabled, summariesEnabled, completedAt, sentPushes } = input;

    if (toLocalHour(now, timezone) !== reminderHour) return null;

    const today = toLocalDateStr(now, timezone);

    const alreadySentToday = sentPushes.some(
        (push) => toLocalDateStr(toDate(push.createdAt), timezone) === today
    );

    if (alreadySentToday) return null;

    const completedDates = completedAt.map((date) => toLocalDateStr(toDate(date), timezone));
    const hasSessionIn = ({ from, to }: { from: string; to: string }) =>
        completedDates.some((date) => date >= from && date <= to);

    if (summariesEnabled) {
        if (today.endsWith("-01")) {
            const period = monthlyPeriod(today);

            if (hasSessionIn(period)) return { kind: "MONTHLY_SUMMARY", periodKey: period.periodKey };
        }

        if (isSunday(today)) {
            const period = weeklyPeriod(today);

            if (hasSessionIn(period)) return { kind: "WEEKLY_SUMMARY", periodKey: period.periodKey };
        }
    }

    return remindersEnabled ? decideReminder(input, today) : null;
};

export interface SummarySession {
    trackingMode: "FULL" | "SIMPLE";
    sessionSet: readonly (VolumeSet & { excludedFromRecords: boolean })[];
}

export interface PeriodSummary {
    sessions: number;
    volume: number;
    records: number;
}

/**
 * Totais de um período. O volume soma só séries medidas do modo completo: no modo simples
 * as reps são presumidas, e `excludedFromRecords` marca série inválida.
 */
export const summarizePeriod = (
    sessions: readonly SummarySession[],
    recordExerciseIds: readonly number[]
): PeriodSummary => ({
    sessions: sessions.length,
    volume: calculateTotalVolume(
        sessions
            .filter((session) => session.trackingMode === "FULL")
            .flatMap((session) => session.sessionSet.filter((set) => !set.excludedFromRecords))
    ),
    // Um exercício pode ter recorde de carga e de volume: conta como um.
    records: new Set(recordExerciseIds).size,
});

export interface NotificationMessage {
    title: string;
    body: string;
}

const plural = (count: number, singular: string, pluralForm: string) =>
    `${count} ${count === 1 ? singular : pluralForm}`;

export const reminderMessage = (
    daysSinceLastWorkout: number | null,
    nextWorkoutName: string | null
): NotificationMessage => {
    if (daysSinceLastWorkout === null) {
        return { title: "Seu primeiro treino está esperando", body: "Leva só um toque para começar" };
    }

    return {
        title: `Faz ${daysSinceLastWorkout} ${daysSinceLastWorkout === 1 ? "dia" : "dias"} desde o último treino`,
        body: nextWorkoutName ? `Próximo: ${nextWorkoutName}` : "Quando quiser, seus treinos estão aqui",
    };
};

export const summaryMessage = (
    kind: "WEEKLY_SUMMARY" | "MONTHLY_SUMMARY",
    summary: PeriodSummary
): NotificationMessage => {
    const volume = Math.round(summary.volume);
    const parts = [
        plural(summary.sessions, "treino", "treinos"),
        // Sem volume medido, o trecho some: "0 kg" diria que a pessoa não levantou nada.
        ...(volume > 0 ? [`${volume.toLocaleString("pt-BR")} kg`] : []),
        ...(summary.records > 0 ? [plural(summary.records, "recorde", "recordes")] : []),
    ];

    return {
        title: kind === "WEEKLY_SUMMARY" ? "Sua semana" : "Seu mês",
        body: parts.join(" · "),
    };
};
