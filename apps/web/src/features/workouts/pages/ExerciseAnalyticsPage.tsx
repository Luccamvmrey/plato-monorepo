import { useExerciseAnalytics } from "@/features/workouts/hooks/useExerciseAnalytics";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, Weight, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeaderSlot } from "@/core/components/NavBarSlot";
import { MuscleBadge } from "@/core/components/MuscleBadge";
import { AnalyticsChart } from "../components/exercise-analytics/AnalyticsChart";
import { ExecutionHistoryList } from "../components/exercise-analytics/ExecutionHistoryList";

const ExerciseAnalyticsPage = ({ params }: { params: { id: string } }) => {
    const exerciseId = parseInt(params.id);
    const {
        isLoading,
        exerciseInfo,
        records,
        chartData,
        exerciseData,
        goBack
    } = useExerciseAnalytics(exerciseId);

    if (isLoading) return <LoadingOverlay isLoading={true} />;

    if (exerciseData.length === 0) {
        return (
            <div className="h-full flex flex-col gap-4 mb-[100px]">
                <HeaderSlot>
                    <div className="bg-card flex flex-row items-center justify-between p-4 rounded-xl border w-full">
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={goBack} className="-ml-2">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <span className="font-bold text-lg text-foreground">Análise de Exercício</span>
                        </div>
                    </div>
                </HeaderSlot>

                <div className="flex flex-col items-center justify-center py-20 text-center px-6 bg-card border rounded-xl border-dashed">
                    <TrendingUp className="w-12 h-12 text-muted-foreground opacity-20 mb-4" />
                    <h3 className="text-xl font-bold mb-2">Sem dados analíticos</h3>
                    <p className="text-muted-foreground">
                        Este exercício ainda não foi realizado em nenhuma sessão concluída.
                    </p>
                    <Button variant="outline" className="mt-6" onClick={goBack}>
                        Voltar para Histórico
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col gap-4 mb-[100px]">
            <HeaderSlot>
                <div className="bg-card flex flex-row items-center justify-between p-4 rounded-xl border w-full">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={goBack} className="-ml-2">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <span className="font-bold text-lg text-foreground">Análise de Exercício</span>
                    </div>
                </div>
            </HeaderSlot>

            <div className="flex flex-col gap-6">
                <header>
                    <h1 className="text-2xl font-bold">{exerciseInfo?.name}</h1>
                    {exerciseInfo && <MuscleBadge muscle={exerciseInfo.targetMuscle} />}
                </header>

                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Award className="w-4 h-4 text-primary" />
                            Recordes Pessoais
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground uppercase">Carga Máxima</span>
                            <span className="text-xl font-bold">
                                {records?.find(r => r.type === 'WEIGHT')?.value || 0} kg
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground uppercase">Volume Máximo</span>
                            <span className="text-xl font-bold">
                                {records?.find(r => r.type === 'VOLUME')?.value.toLocaleString() || 0} kg
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            Evolução de e1RM (Brzycki + RPE)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <AnalyticsChart 
                            data={chartData.map(d => ({ date: d.date, value: d.maxE1RM }))}
                            strokeColor="#10b981"
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Weight className="w-4 h-4 text-secondary-foreground" />
                            Volume por Sessão (Tonnage)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <AnalyticsChart 
                            data={chartData.map(d => ({ date: d.date, value: d.totalVolume }))}
                            strokeColor="#3b82f6" // Use blue for volume to distinguish
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Últimas Execuções</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ExecutionHistoryList data={exerciseData} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ExerciseAnalyticsPage;
