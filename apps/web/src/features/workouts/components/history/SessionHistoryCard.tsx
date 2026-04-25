import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Weight, Zap, ChevronRight, Award } from "lucide-react";
import type { WorkoutSession } from "@/features/workouts/workout.types";
import { useSessionHistoryCardLogic } from "@/features/workouts/hooks/useSessionHistoryCardLogic";

interface SessionHistoryCardProps {
    session: WorkoutSession;
    allRecords?: any[];
    navigate: (path: string) => void;
}

export const SessionHistoryCard = ({ session, allRecords, navigate }: SessionHistoryCardProps) => {
    const {
        totalVolume,
        avgRpe,
        completedAt,
        exercises,
        handleExerciseClick
    } = useSessionHistoryCardLogic(session, allRecords, navigate);

    return (
        <Card className="overflow-hidden border-l-4 border-l-primary">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg">
                            {(session as any).workout?.name || "Treino Avulso"}
                            {((session as any).workout && !(session as any).workout.isActive) && (
                                <span className="text-[10px] ml-2 text-muted-foreground uppercase">(Arquivado)</span>
                            )}
                        </CardTitle>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <CalendarIcon className="w-3 h-3" />
                            {completedAt ? format(completedAt, "PPP", { locale: ptBR }) : "Em progresso"}
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <Weight className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase">Volume Total</p>
                            <p className="font-bold">{totalVolume.toLocaleString()} kg</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-secondary/20 rounded-full">
                            <Zap className="w-4 h-4 text-secondary-foreground" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase">RPE Médio</p>
                            <p className="font-bold">{avgRpe.toFixed(1)}</p>
                        </div>
                    </div>
                </div>
                
                <div className="mt-4 flex flex-wrap gap-2">
                    <Badge variant="outline">
                        {session.sessionSet.length} sets
                    </Badge>
                    <Badge variant="outline">
                        {new Set(session.sessionSet.map(s => s.exerciseId)).size} exercícios
                    </Badge>
                </div>

                <div className="mt-4 pt-4 border-t">
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Exercícios Realizados</p>
                    <div className="flex flex-col gap-1">
                        {exercises.map(ex => (
                            <button 
                                key={ex.id}
                                onClick={() => handleExerciseClick(ex.id)}
                                className="flex items-center justify-between p-2 hover:bg-muted rounded-md transition-colors text-sm text-left group"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">{ex.name}</span>
                                    {ex.hasPr && <Award className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                                </div>
                                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </button>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
