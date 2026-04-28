import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SetEntry {
    date: Date;
    weight: number;
    reps: number;
    rpe: number;
    e1rm: number;
}

interface ExecutionHistoryListProps {
    data: SetEntry[];
}

export const ExecutionHistoryList = ({ data }: ExecutionHistoryListProps) => {
    const sorted = data.slice().reverse();

    const grouped: { date: string; sets: SetEntry[] }[] = [];
    const seen = new Set<string>();

    for (const entry of sorted) {
        const key = format(entry.date, "dd 'de' MMMM", { locale: ptBR });
        if (!seen.has(key)) {
            seen.add(key);
            grouped.push({ date: key, sets: [] });
        }
        grouped[grouped.length - 1].sets.push(entry);
    }

    return (
        <div className="mx-4 mb-6 bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
                <p className="text-[13px] font-medium text-foreground">Últimas execuções</p>
            </div>

            {grouped.map(({ date, sets }) => (
                <div key={date}>
                    <div className="px-4 py-2 bg-muted/40">
                        <p className="text-[11px] font-medium tracking-[0.04em] uppercase text-muted-foreground">
                            {date}
                        </p>
                    </div>
                    {sets.map((set, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0"
                        >
                            <span className="text-[13px] font-medium text-foreground w-20 flex-shrink-0">
                                {set.weight}kg × {set.reps}
                            </span>
                            <span className="text-[12px] text-muted-foreground">
                                RPE {set.rpe}
                            </span>
                            <span className="ml-auto text-[12px] text-muted-foreground">
                                ~{set.e1rm.toFixed(1)} kg
                            </span>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};
