import { motion, type Variants } from "framer-motion";
import { Button } from "@/components/ui/button.tsx";
import { LoadingOverlay } from "@/components/ui/loading-overlay.tsx";
import { path } from "@/core/constants/path.ts";
import { useWorkoutSummaryLogic } from "@/features/workouts/hooks/useWorkoutSummaryLogic.ts";
import { formatDateShort, formatWeight } from "@/core/utils/formatters";
import { formatDurationExtensive } from "@/core/utils/time";
import SummaryPRBanner from "../components/workout-summary/SummaryPRBanner";
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

    if (isLoading) return <LoadingOverlay isLoading={true} />;

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
            className="flex flex-col pb-24 overflow-y-auto"
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
            <SummaryMetricsGrid metrics={metrics} />
            <SummaryExerciseList exercises={stats.completedExercises} />
            <SummaryVolumeChart volumeByGroup={stats.volumeByGroup} />

            <div className="fixed bottom-0 inset-x-0 p-4 pb-6 bg-background/95 backdrop-blur-sm border-t border-border">
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
