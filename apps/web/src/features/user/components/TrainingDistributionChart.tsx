import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart } from "lucide-react";
import { muscleGroupTranslation } from "@/core/utils/translations";
import { Progress } from "@/components/ui/progress";

interface TrainingDistributionChartProps {
    distribution: Array<{ muscle: string, percentage: number }>;
}

export const TrainingDistributionChart = ({ distribution }: TrainingDistributionChartProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-primary" />
                    Distribuição de Treino
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-4">
                    {distribution.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Sem dados de distribuição disponíveis.
                        </p>
                    )}
                    {distribution
                        .sort((a, b) => b.percentage - a.percentage)
                        .map((item) => (
                            <div key={item.muscle} className="flex flex-col gap-1.5">
                                <div className="flex justify-between text-xs font-medium uppercase tracking-tighter">
                                    <span>{muscleGroupTranslation[item.muscle as keyof typeof muscleGroupTranslation] || item.muscle}</span>
                                    <span className="text-muted-foreground">{item.percentage.toFixed(1)}%</span>
                                </div>
                                <Progress value={item.percentage} className="h-2" />
                            </div>
                        ))}
                </div>
            </CardContent>
        </Card>
    );
};
