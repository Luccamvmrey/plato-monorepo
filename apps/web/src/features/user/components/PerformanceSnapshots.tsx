import { muscleGroupTranslation } from "@/core/utils/translations";
import type { MuscleGroup } from "@plato/database/generated/prisma/enums";

interface PerformanceSnapshotsProps {
    peakStrength: Record<string, number>;
    volumeLeaders: Record<string, { name: string; volume: number }>;
}

/**
 * Antes eram duas listas iguais por grupo muscular, uma para carga e outra para volume,
 * cada uma com seu cartão. Lado a lado na mesma linha se lê o grupo inteiro de uma vez.
 */
export const PerformanceSnapshots = ({ peakStrength, volumeLeaders }: PerformanceSnapshotsProps) => {
    const muscles = Array.from(new Set([...Object.keys(peakStrength), ...Object.keys(volumeLeaders)]));

    return (
        <section className="mx-4 mb-4 bg-card border border-border rounded-xl">
            <h2 className="px-4 pt-4 pb-2 text-[15px] font-medium tracking-[-0.02em]">Melhores por grupo</h2>

            {muscles.length === 0 ? (
                <p className="px-4 pb-4 text-[13px] text-muted-foreground">
                    Suas melhores cargas aparecem aqui conforme você completa os exercícios.
                </p>
            ) : (
                <ul className="px-4 pb-1">
                    {muscles.map((muscle) => {
                        const load = peakStrength[muscle];
                        const leader = volumeLeaders[muscle];

                        return (
                            <li key={muscle} className="flex items-center gap-3 py-3 border-t border-border">
                                <div className="flex-1 min-w-0">
                                    <p className="text-[14px] font-medium">
                                        {muscleGroupTranslation[muscle as MuscleGroup]}
                                    </p>
                                    {leader && (
                                        <p className="text-[13px] text-muted-foreground truncate mt-0.5">
                                            Mais volume: {leader.name}
                                        </p>
                                    )}
                                </div>
                                {load !== undefined && (
                                    <p className="text-[17px] font-semibold tracking-[-0.02em] tabular-nums whitespace-nowrap">
                                        {load.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
                                        <span className="text-[13px] font-normal tracking-normal text-muted-foreground ml-1">kg</span>
                                    </p>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
};
