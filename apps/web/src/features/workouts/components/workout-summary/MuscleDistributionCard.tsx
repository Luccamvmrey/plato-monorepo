import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { PieChart as PieChartIcon } from "lucide-react";
import { muscleGroupTranslation } from "@/core/utils/translations.ts";
import type { MuscleGroup } from "@plato/database/dist/generated/prisma/enums.ts";

type DistributionItem = {
    muscle: MuscleGroup;
    percentage: number;
    absoluteVolume: number;
};

type MuscleDistributionCardProps = {
    distribution: DistributionItem[];
};

export const MuscleDistributionCard = ({ distribution }: MuscleDistributionCardProps) => (
    <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="p-2 bg-slate-200 dark:bg-slate-800 rounded-lg">
                <PieChartIcon className="size-5" />
            </div>
            <CardTitle className="text-lg">Distribuição de Volume</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
            {distribution.map((item, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                        <span>{muscleGroupTranslation[item.muscle] || item.muscle}</span>
                        <div className="flex gap-2 items-center">
                            <span className="text-muted-foreground font-medium lowercase">({Math.round(item.absoluteVolume)}kg)</span>
                            <span>{Math.round(item.percentage)}%</span>
                        </div>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-primary transition-all duration-1000" 
                            style={{ width: `${item.percentage}%` }}
                        />
                    </div>
                </div>
            ))}
        </CardContent>
    </Card>
);
