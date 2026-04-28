import { Award, BarChart2 } from "lucide-react";
import { MuscleBadge } from "@/core/components/MuscleBadge";
import { cn } from "@/lib/utils";
import type { MuscleGroup } from "@plato/database/generated/prisma/enums";

interface PerformanceSnapshotsProps {
    peakStrength: Record<string, number>;
    volumeLeaders: Record<string, { name: string; volume: number }>;
}

export const PerformanceSnapshots = ({ peakStrength, volumeLeaders }: PerformanceSnapshotsProps) => {
    const strengthEntries = Object.entries(peakStrength);
    const volumeEntries = Object.entries(volumeLeaders);

    return (
        <>
            {/* Cargas máximas */}
            <div className="mx-4 mb-4 bg-card border border-border rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                    <Award className="w-4 h-4 text-pr flex-shrink-0" />
                    <p className="text-[13px] font-medium text-foreground">Cargas máximas</p>
                </div>

                {strengthEntries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                        <p className="text-[13px] text-muted-foreground">
                            Suas cargas máximas aparecerão aqui conforme você completa os exercícios.
                        </p>
                    </div>
                ) : (
                    strengthEntries.map(([muscle, maxLoad], i) => (
                        <div
                            key={muscle}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3",
                                i < strengthEntries.length - 1 && "border-b border-border"
                            )}
                        >
                            <MuscleBadge muscle={muscle as MuscleGroup} />
                            <span className="ml-auto text-[13px] font-medium text-foreground">
                                {maxLoad}
                                <span className="text-[12px] font-normal text-muted-foreground ml-1">kg</span>
                            </span>
                        </div>
                    ))
                )}
            </div>

            {/* Líderes de volume */}
            <div className="mx-4 mb-4 bg-card border border-border rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                    <BarChart2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <p className="text-[13px] font-medium text-foreground">Líderes de volume</p>
                </div>

                {volumeEntries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                        <p className="text-[13px] text-muted-foreground">
                            Seus exercícios com maior volume aparecerão aqui.
                        </p>
                    </div>
                ) : (
                    volumeEntries.map(({ 0: muscle, 1: leader }, i) => (
                        <div
                            key={muscle}
                            className={cn(
                                "px-4 py-3",
                                i < volumeEntries.length - 1 && "border-b border-border"
                            )}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <MuscleBadge muscle={muscle as MuscleGroup} />
                                <span className="text-[12px] text-muted-foreground">{leader.volume.toLocaleString()} kg</span>
                            </div>
                            <p className="text-[13px] font-medium text-foreground">{leader.name}</p>
                        </div>
                    ))
                )}
            </div>
        </>
    );
};
