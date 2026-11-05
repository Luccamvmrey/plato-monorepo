import {
    addDaysToDateStr,
    daysBetweenDateStrs,
    isoWeekKey,
    mondayOfDateStr,
    toLocalDateStr,
    toLocalHour,
} from "./dates";
import type { VolumeSet } from "./types";
import { calculateTotalVolume } from "./volume";

export type NotificationKindValue = "REMINDER" | "WEEKLY_SUMMARY" | "MONTHLY_SUMMARY";

export const MIN_REMINDER_HOUR = 6;
export const MAX_REMINDER_HOUR = 22;
export const DEFAULT_REMINDER_HOUR = 18;

/** Abaixo disso a mediana diz mais sobre um dia isolado do que sobre um hábito. */
const MIN_SESSIONS_FOR_HABIT = 4;
const OPEN_SESSION_WINDOW_MS = 6 * 3_600_000;
/** Dias desde a segunda-feira a partir dos quais não há lembrete: sábado e domingo. */
const FIRST_WEEKEND_OFFSET = 5;

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
    /** Push enviados. Só precisa cobrir os últimos dias, para o limite de um por dia. */
    sentPushes: readonly { createdAt: DateLike }[];
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

const isWeekend = (dateStr: string): boolean =>
    daysBetweenDateStrs(mondayOfDateStr(dateStr), dateStr) >= FIRST_WEEKEND_OFFSET;

const shouldRemind = (
    { now, openSessionStartedAt }: NotificationDecisionInput,
    today: string,
    completedDates: readonly string[]
): boolean => {
    if (isWeekend(today) || completedDates.includes(today)) return false;

    return (
        openSessionStartedAt === null ||
        now.getTime() - toDate(openSessionStartedAt).getTime() >= OPEN_SESSION_WINDOW_MS
    );
};

/**
 * O que enviar por push agora, se algo. Prioridade: mensal, semanal, lembrete.
 *
 * O lembrete é diário de propósito, de segunda a sexta: serve para lembrar que o Plato existe,
 * não para reagir à frequência de treino de cada um. Só fica de fora quem já treinou no dia.
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

    return remindersEnabled && shouldRemind(input, today, completedDates)
        ? { kind: "REMINDER", periodKey: today }
        : null;
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
