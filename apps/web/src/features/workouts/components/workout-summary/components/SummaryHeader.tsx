interface SummaryHeaderProps {
    workoutName: string;
}

export const SummaryHeader = ({ workoutName }: SummaryHeaderProps) => {
    return (
        <div className="flex flex-col gap-1 text-center py-4">
            <h1 className="text-3xl font-bold text-primary">Treino Finalizado!</h1>
            <p className="text-muted-foreground font-medium">{workoutName}</p>
        </div>
    );
};
