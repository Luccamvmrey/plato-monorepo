type PendingSetRowProps = {
    setNum: number;
    reps: number;
    weight?: number;
};

export const PendingSetRow = ({ setNum, reps, weight }: PendingSetRowProps) => (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/30 opacity-40">
        <span className="w-6 h-6 rounded-md bg-muted flex items-center justify-center text-[11px] font-medium text-muted-foreground flex-shrink-0">
            {setNum}
        </span>
        <span className="text-[12px] text-muted-foreground">
            {weight && weight > 0 ? `${weight} kg` : '—'} · {reps} reps
        </span>
    </div>
);
