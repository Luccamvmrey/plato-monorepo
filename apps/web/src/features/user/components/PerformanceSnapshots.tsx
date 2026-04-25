import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, BarChart3 } from "lucide-react";
import { muscleGroupTranslation } from "@/core/utils/translations";
import { Badge } from "@/components/ui/badge";

interface PerformanceSnapshotsProps {
    peakStrength: Record<string, number>;
    volumeLeaders: Record<string, { name: string, volume: number }>;
}

export const PerformanceSnapshots = ({ peakStrength, volumeLeaders }: PerformanceSnapshotsProps) => {
    const strengthMuscles = Object.keys(peakStrength);
    const volumeMuscles = Object.keys(volumeLeaders);

    return (
        <div className="flex flex-col gap-4">
            {/* Peak Strength Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Award className="w-5 h-5 text-yellow-500" />
                        Cargas Máximas (PRs)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-3">
                        {strengthMuscles.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                                <Award className="w-8 h-8 text-muted-foreground opacity-20 mb-2" />
                                <p className="text-sm text-muted-foreground">
                                    Suas cargas máximas por grupamento aparecerão aqui conforme você completa os exercícios.
                                </p>
                            </div>
                        )}
                        {strengthMuscles.map(muscle => (
                            <div key={muscle} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                                <span className="text-xs font-bold uppercase text-muted-foreground">
                                    {muscleGroupTranslation[muscle as keyof typeof muscleGroupTranslation] || muscle}
                                </span>
                                <p className="font-black text-primary">{peakStrength[muscle]} <span className="text-[10px] font-normal">kg</span></p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Volume Leaders Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        Líderes de Volume
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-3">
                        {volumeMuscles.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                                <BarChart3 className="w-8 h-8 text-muted-foreground opacity-20 mb-2" />
                                <p className="text-sm text-muted-foreground">
                                    Seus exercícios com maior volume aparecerão aqui.
                                </p>
                            </div>
                        )}
                        {volumeMuscles.map(muscle => (
                            <div key={muscle} className="flex flex-col gap-1.5 p-3 rounded-lg bg-muted/30 border">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                                        {muscleGroupTranslation[muscle as keyof typeof muscleGroupTranslation] || muscle}
                                    </span>
                                    <Badge variant="outline" className="text-[9px] h-4 px-1.5">
                                        {volumeLeaders[muscle].volume.toLocaleString()} kg
                                    </Badge>
                                </div>
                                <p className="text-sm font-bold truncate">
                                    {volumeLeaders[muscle].name}
                                </p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
