import { addDays, format, isAfter, isSameDay, startOfDay, startOfWeek, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { WorkoutSession } from "../workout.types";

export interface CalendarDay {
    key: string;
    date: Date;
    sessions: number;
    isFuture: boolean;
    isToday: boolean;
}

export interface TrainingCalendar {
    /** Uma coluna por semana, da mais antiga para a atual. Cada uma vai de segunda a domingo. */
    weeks: CalendarDay[][];
    /** Rótulo do mês na coluna em que ele começa. */
    monthLabels: { weekIndex: number; label: string }[];
    last28Days: number;
    perWeek: number;
}

const WEEKS_SHOWN = 16;
const DAY_KEY = "yyyy-MM-dd";

/** Função pura, com `today` por parâmetro: a data local é o que decide em que dia se treinou. */
export const buildTrainingCalendar = (
    sessions: readonly WorkoutSession[],
    today: Date,
): TrainingCalendar => {
    const completedAt = sessions.flatMap((session) => session.completedAt ? [new Date(session.completedAt)] : []);

    const countByDay = new Map<string, number>();
    for (const date of completedAt) {
        const key = format(date, DAY_KEY);
        countByDay.set(key, (countByDay.get(key) ?? 0) + 1);
    }

    const firstMonday = subWeeks(startOfWeek(today, { weekStartsOn: 1 }), WEEKS_SHOWN - 1);

    const weeks = Array.from({ length: WEEKS_SHOWN }, (_, weekIndex) =>
        Array.from({ length: 7 }, (_, dayIndex): CalendarDay => {
            const date = addDays(firstMonday, weekIndex * 7 + dayIndex);
            const key = format(date, DAY_KEY);

            return {
                key,
                date,
                sessions: countByDay.get(key) ?? 0,
                isFuture: isAfter(startOfDay(date), startOfDay(today)),
                isToday: isSameDay(date, today),
            };
        })
    );

    const monthLabels: TrainingCalendar["monthLabels"] = [];
    weeks.forEach((week, weekIndex) => {
        const month = week[0].date.getMonth();
        const previous = weeks[weekIndex - 1]?.[0].date.getMonth();

        if (month !== previous) {
            monthLabels.push({ weekIndex, label: format(week[0].date, "MMM", { locale: ptBR }).replace(".", "") });
        }
    });

    const windowStart = startOfDay(addDays(today, -27));
    const last28Days = completedAt.filter((date) => !isAfter(windowStart, date)).length;

    return { weeks, monthLabels, last28Days, perWeek: last28Days / 4 };
};

export interface SessionMonth<T> {
    key: string;
    label: string;
    sessions: T[];
}

/** Agrupa mantendo a ordem recebida. Sessão em andamento entra no mês em que começou. */
export const groupSessionsByMonth = <T extends Pick<WorkoutSession, "startedAt" | "completedAt">>(
    sessions: readonly T[],
): SessionMonth<T>[] => {
    const months: SessionMonth<T>[] = [];

    for (const session of sessions) {
        const date = new Date(session.completedAt ?? session.startedAt);
        const key = format(date, "yyyy-MM");
        const current = months[months.length - 1];

        if (current?.key === key) {
            current.sessions.push(session);
        } else {
            const label = format(date, "MMMM 'de' yyyy", { locale: ptBR });
            months.push({ key, label: label[0].toUpperCase() + label.slice(1), sessions: [session] });
        }
    }

    return months;
};
