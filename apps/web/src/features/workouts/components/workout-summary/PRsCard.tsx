import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Trophy } from "lucide-react";

type PR = {
    exerciseName: string;
    weight: number;
    improvement: number;
};

type PRsCardProps = {
    prs: PR[];
};

export const PRsCard = ({ prs }: PRsCardProps) => {
    if (prs.length === 0) return null;

    return (
        <Card className="border-2 border-amber-500/20 bg-amber-500/5 shadow-sm">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <div className="p-2 bg-amber-500 rounded-lg text-white">
                    <Trophy className="size-5" />
                </div>
                <CardTitle className="text-lg">Novos Recordes! (PRs)</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
                {prs.map((pr, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-background rounded-lg border shadow-sm">
                        <div className="flex flex-col">
                            <span className="font-bold text-sm">{pr.exerciseName}</span>
                            <span className="text-xs text-emerald-600 font-bold">+{pr.improvement}kg vs último treino</span>
                        </div>
                        <div className="text-xl font-black">{pr.weight}kg</div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};
