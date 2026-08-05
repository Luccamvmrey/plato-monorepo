import { motion, type Variants } from "framer-motion";
import { useUserProfile } from "../hooks/useUserProfile";
import { useUserStats } from "../hooks/useUserStats";
import { useStreakData } from "../hooks/useStreakData";
import { UserProfileSkeleton } from "../components/UserProfileSkeleton";
import { IdentityCard } from "../components/IdentityCard";
import StreakCard from "../components/StreakCard";
import { PerformanceSnapshots } from "../components/PerformanceSnapshots";
import { TrainingDistributionChart } from "../components/TrainingDistributionChart";
import { GovernanceSettings } from "../components/GovernanceSettings";

const stagger: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const staggerItem: Variants = {
    hidden: { opacity: 0, y: 14 },
    show: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 380, damping: 28 },
    },
};

const UserProfilePage = () => {
    const { data: profile, isLoading: profileLoading } = useUserProfile();
    const { data: stats, isLoading: statsLoading } = useUserStats();
    const { data: streakData } = useStreakData();

    const isLoading = profileLoading || statsLoading;

    return (
        <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="flex flex-col mb-[100px] -mx-4 -mt-4"
        >
            {/* Header inline */}
            <motion.div variants={staggerItem} className="px-4 pt-6 pb-2">
                <h1 className="text-[22px] font-medium tracking-[-0.03em]">Perfil</h1>
            </motion.div>

            {/* Cada seção já era guardada individualmente, então o gate bloqueante
                da página só atrasava o header e as configurações — que não
                dependem de query nenhuma. */}
            {isLoading && <UserProfileSkeleton />}

            {profile && (
                <motion.div variants={staggerItem}>
                    <IdentityCard
                        name={profile.name}
                        email={profile.email}
                        createdAt={profile.createdAt}
                        totalSessions={profile.totalSessions}
                        lifetimeVolume={profile.lifetimeVolume}
                        totalPRs={profile.totalPRs}
                    />
                </motion.div>
            )}

            {streakData && (
                <motion.div variants={staggerItem}>
                    <StreakCard streak={streakData} />
                </motion.div>
            )}

            {stats && (
                <>
                    <motion.div variants={staggerItem}>
                        <PerformanceSnapshots
                            peakStrength={stats.peakStrength}
                            volumeLeaders={stats.volumeLeaders}
                        />
                    </motion.div>

                    <motion.div variants={staggerItem}>
                        <TrainingDistributionChart distribution={stats.distribution} />
                    </motion.div>
                </>
            )}

            <motion.div variants={staggerItem}>
                <GovernanceSettings />
            </motion.div>
        </motion.div>
    );
};

export default UserProfilePage;
