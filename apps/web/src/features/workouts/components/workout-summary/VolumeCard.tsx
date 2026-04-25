import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Dumbbell } from "lucide-react";

type VolumeCardProps = {
    totalVolume: number;
};

export const VolumeCard = ({ totalVolume }: VolumeCardProps) => (
    <Card className="border-2 border-primary/20 bg-primary/5">
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="p-2 bg-primary rounded-lg text-primary-foreground">
                <Dumbbell className="size-5" />
            </div>
            <CardTitle className="text-lg">Volume Total</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="text-4xl font-black tabular-nums">
                {totalVolume.toLocaleString()} <span className="text-xl font-bold text-muted-foreground">kg</span>
            </div>
        </CardContent>
    </Card>
);
