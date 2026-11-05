/**
 * Datas locais do usuário, sempre como string `YYYY-MM-DD`.
 *
 * A VPS roda em UTC e o usuário não. Toda aritmética opera sobre a string, com
 * `Date.UTC`, para nada depender do fuso do sistema.
 */

export const isValidTimezone = (timezone: string): boolean => {
    try {
        new Intl.DateTimeFormat("en-CA", { timeZone: timezone });
        return true;
    } catch {
        return false;
    }
};

export const toLocalDateStr = (date: Date, timezone: string): string =>
    new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date);

/** Hora local de 0 a 23. `h23` porque `en-CA` poderia devolver "24" à meia-noite. */
export const toLocalHour = (date: Date, timezone: string): number =>
    Number(
        new Intl.DateTimeFormat("en-CA", {
            timeZone: timezone,
            hour: "2-digit",
            hourCycle: "h23",
        }).format(date)
    );

const toUtcDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split("-").map(Number);

    return new Date(Date.UTC(year, month - 1, day));
};

export const addDaysToDateStr = (dateStr: string, days: number): string => {
    const date = toUtcDate(dateStr);

    date.setUTCDate(date.getUTCDate() + days);

    return date.toISOString().split("T")[0];
};

/** Dias de `from` até `to`. Positivo quando `to` é depois. */
export const daysBetweenDateStrs = (from: string, to: string): number =>
    Math.round((toUtcDate(to).getTime() - toUtcDate(from).getTime()) / 86_400_000);

/** A segunda-feira da semana a que a data pertence. */
export const mondayOfDateStr = (dateStr: string): string => {
    const dayOfWeek = toUtcDate(dateStr).getUTCDay();

    return addDaysToDateStr(dateStr, dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
};

/** Semana ISO (`2026-W45`). O ano é o da quinta-feira da semana, como a norma define. */
export const isoWeekKey = (dateStr: string): string => {
    const thursday = addDaysToDateStr(mondayOfDateStr(dateStr), 3);
    const year = thursday.slice(0, 4);
    const week = Math.floor(daysBetweenDateStrs(`${year}-01-01`, thursday) / 7) + 1;

    return `${year}-W${String(week).padStart(2, "0")}`;
};
