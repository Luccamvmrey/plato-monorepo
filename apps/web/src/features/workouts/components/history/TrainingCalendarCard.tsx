import { cn } from "@/lib/utils";
import type { TrainingCalendar } from "@/features/workouts/utils/history-summary";

const WEEKDAY_LABELS = ["seg", "", "qua", "", "sex", "", "dom"];

const perWeekLabel = (value: number) =>
    value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/**
 * Dezesseis semanas de um olhar só: aderência é o que decide resultado em hipertrofia, e uma
 * lista de sessões não mostra falha nem constância.
 */
export const TrainingCalendarCard = ({ calendar }: { calendar: TrainingCalendar }) => {
    const { weeks, monthLabels, last28Days, perWeek } = calendar;

    return (
        <section aria-label="Frequência de treino" className="bg-card border border-border rounded-xl p-4 flex flex-col gap-4">
            <div className="flex items-end justify-between gap-4">
                <div>
                    <p className="text-[32px] font-semibold tracking-[-0.03em] leading-none tabular-nums">
                        {last28Days}
                    </p>
                    <p className="text-[13px] text-muted-foreground mt-1.5">
                        {last28Days === 1 ? "treino" : "treinos"} em 4 semanas
                    </p>
                </div>
                <p className="text-[13px] text-muted-foreground text-right">
                    <span className="text-foreground font-medium tabular-nums">{perWeekLabel(perWeek)}</span> por semana
                </p>
            </div>

            <div
                role="img"
                aria-label={`${last28Days} treinos nas últimas 4 semanas, média de ${perWeekLabel(perWeek)} por semana`}
                className="grid gap-x-1 gap-y-1"
                style={{ gridTemplateColumns: `26px repeat(${weeks.length}, minmax(0, 1fr))` }}
            >
                <span />
                {weeks.map((_, weekIndex) => {
                    const month = monthLabels.find((item) => item.weekIndex === weekIndex);

                    return (
                        <span key={weekIndex} className="relative h-4">
                            {month && (
                                <span className="absolute left-0 top-0 text-[11px] leading-4 text-muted-foreground whitespace-nowrap">
                                    {month.label}
                                </span>
                            )}
                        </span>
                    );
                })}

                {WEEKDAY_LABELS.map((label, dayIndex) => (
                    <div key={dayIndex} className="contents">
                        <span className="text-[11px] leading-none text-muted-foreground self-center">{label}</span>
                        {weeks.map((week) => {
                            const day = week[dayIndex];

                            return (
                                <span
                                    key={day.key}
                                    title={day.sessions > 0 ? `${day.sessions} treino em ${day.key}` : undefined}
                                    className={cn(
                                        "aspect-square rounded-[3px]",
                                        day.isFuture ? "bg-transparent" : day.sessions > 0 ? "bg-primary" : "bg-muted",
                                        day.isToday && "ring-1 ring-foreground/60 ring-offset-1 ring-offset-card"
                                    )}
                                />
                            );
                        })}
                    </div>
                ))}
            </div>
        </section>
    );
};
