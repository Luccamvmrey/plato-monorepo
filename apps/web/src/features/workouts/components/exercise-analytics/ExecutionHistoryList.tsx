import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ExecutionHistoryListProps {
    data: {
        date: Date;
        weight: number;
        reps: number;
        rpe: number;
        e1rm: number;
    }[];
}

export const ExecutionHistoryList = ({ data }: ExecutionHistoryListProps) => {
    return (
        <div className="flex flex-col gap-2">
            {data.slice().reverse().slice(0, 5).map((d, i) => (
                <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-muted/50 text-sm">
                    <span>{format(d.date, "dd MMM", { locale: ptBR })}</span>
                    <div className="flex gap-4">
                        <span className="font-medium">{d.weight}kg x {d.reps}</span>
                        <span className="text-muted-foreground">RPE {d.rpe}</span>
                        <span className="text-primary font-bold">~{d.e1rm.toFixed(1)}kg</span>
                    </div>
                </div>
            ))}
        </div>
    );
};
