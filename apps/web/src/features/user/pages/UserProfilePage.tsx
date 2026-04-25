import { useUserProfile } from "../hooks/useUserProfile";
import { useUserStats } from "../hooks/useUserStats";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { IdentityCard } from "../components/IdentityCard";
import { PerformanceSnapshots } from "../components/PerformanceSnapshots";
import { TrainingDistributionChart } from "../components/TrainingDistributionChart";
import { GovernanceSettings } from "../components/GovernanceSettings";
import { HeaderSlot } from "@/core/components/NavBarSlot";
import { User as UserIcon } from "lucide-react";

const UserProfilePage = () => {
    const { data: profile, isLoading: profileLoading } = useUserProfile();
    const { data: stats, isLoading: statsLoading } = useUserStats();

    const isLoading = profileLoading || statsLoading;

    if (isLoading) return <LoadingOverlay isLoading={true} />;

    return (
        <div className="h-full flex flex-col gap-4 mb-[100px]">
            <HeaderSlot>
                <div className="bg-card flex flex-row items-center gap-2 p-4 rounded-xl border w-full">
                    <UserIcon className="w-5 h-5 text-primary" />
                    <span className="font-bold text-lg text-foreground">Perfil</span>
                </div>
            </HeaderSlot>

            {profile && (
                <IdentityCard 
                    name={profile.name}
                    email={profile.email}
                    createdAt={profile.createdAt}
                    totalSessions={profile.totalSessions}
                    lifetimeVolume={profile.lifetimeVolume}
                    totalPRs={profile.totalPRs}
                />
            )}

            <div className="grid grid-cols-1 gap-4">
                {stats && (
                    <>
                        <PerformanceSnapshots 
                            peakStrength={stats.peakStrength}
                            volumeLeaders={stats.volumeLeaders}
                        />
                        <TrainingDistributionChart 
                            distribution={stats.distribution}
                        />
                    </>
                )}
                
                <GovernanceSettings />
            </div>
        </div>
    );
};

export default UserProfilePage;
