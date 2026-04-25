import { VolumeCard } from "../VolumeCard.tsx";
import { PRsCard } from "../PRsCard.tsx";
import { MuscleDistributionCard } from "../MuscleDistributionCard.tsx";
import { type SummaryStats as SummaryStatsType } from "@/features/workouts/hooks/useWorkoutSummaryStats.ts";

interface SummaryStatsProps {
    stats: SummaryStatsType;
}

export const SummaryStats = ({ stats }: SummaryStatsProps) => {
    return (
        <div className="grid grid-cols-1 gap-4">
            <VolumeCard totalVolume={stats.totalVolume} />
            <PRsCard prs={stats.prs} />
            <MuscleDistributionCard distribution={stats.muscleDistribution} />
        </div>
    );
};
