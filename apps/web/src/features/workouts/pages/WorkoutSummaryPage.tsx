import { motion, type Variants } from "framer-motion";
import { Button } from "@/components/ui/button.tsx";
import { WorkoutSummarySkeleton } from "../components/workout-summary/WorkoutSummarySkeleton";
import { path } from "@/core/constants/path.ts";
import { useWorkoutSummaryLogic } from "@/features/workouts/hooks/useWorkoutSummaryLogic.ts";
import { useStreakData } from "@/features/user/hooks/useStreakData";
import { formatDateShort, formatWeight } from "@/core/utils/formatters";
import { formatDurationExtensive } from "@/core/utils/time";
import SummaryPRBanner from "../components/workout-summary/SummaryPRBanner";
import StreakBanner from "../components/workout-summary/StreakBanner";
import SummaryMetricsGrid from "../components/workout-summary/SummaryMetricsGrid";
import SummaryExerciseList from "../components/workout-summary/SummaryExerciseList";
import SummaryVolumeChart from "../components/workout-summary/SummaryVolumeChart";

const stagger: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const staggerItem: Variants = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 380, damping: 28 } },
};

const WorkoutSummaryPage = () => {
    const { navigate, workoutSession, workout, stats, handleFinish, isLoading } =
        useWorkoutSummaryLogic();
    const { data: streakData } = useStreakData();

    if (isLoading) return <WorkoutSummarySkeleton />;

    if (!workoutSession || !workout || !stats) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center gap-4">
                <p className="text-muted-foreground">Dados do treino não encontrados.</p>
                <Button onClick={() => navigate(path.WORKOUTS)}>Voltar</Button>
            </div>
        );
    }

    const metrics = [
        { label: "Volume", value: formatWeight(stats.totalVolume), unit: null },
        { label: "Duração", value: formatDurationExtensive(stats.duration), unit: null },
        { label: "Sets", value: String(stats.totalSets), unit: null },
    ];

    return (
        <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="flex flex-col pb-[184px] overflow-y-auto"
        >
            <motion.div variants={staggerItem} className="pt-6 pb-4 px-4">
                <p className="text-[13px] font-medium text-muted-foreground uppercase tracking-[0.05em] mb-1">
                    Treino finalizado
                </p>
                <h1 className="text-[22px] font-medium tracking-[-0.03em] text-foreground">
                    {workout.name}
                </h1>
                {workoutSession.completedAt && (
                    <p className="text-[13px] text-muted-foreground mt-1">
                        {formatDateShort(workoutSession.completedAt)}
                        {stats.duration > 0 && ` · ${formatDurationExtensive(stats.duration)}`}
                    </p>
                )}
            </motion.div>

            <SummaryPRBanner newPRs={stats.newPRs} />
            {streakData && <StreakBanner streak={streakData} />}
            <SummaryMetricsGrid metrics={metrics} />
            <SummaryExerciseList exercises={stats.completedExercises} unexecuted={stats.unexecuted} />
            <SummaryVolumeChart volumeByGroup={stats.volumeByGroup} />

            {/* Sits above the NavBar rather than sharing `bottom-0` with it —
                the NavBar is z-50 and would otherwise render on top, making this
                the page's primary action unclickable. `.bottom-navbar` em vez de
                `bottom-[92px]` cru: a NavBar mede 92px + safe-area-inset, então o
                valor fixo deixava o botão parcialmente sob a barra em aparelho
                com notch. */}
            <div className="fixed bottom-navbar inset-x-0 z-50 p-4 bg-background/95 backdrop-blur-sm border-t border-border">
                <Button
                    onClick={handleFinish}
                    className="w-full h-12 rounded-lg font-medium text-[15px] tracking-[-0.01em] bg-primary text-primary-foreground"
                >
                    Concluir e Voltar
                </Button>
            </div>
        </motion.div>
    );
};

export default WorkoutSummaryPage;
