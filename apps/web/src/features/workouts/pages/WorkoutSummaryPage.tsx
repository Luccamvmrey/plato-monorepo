import { motion, type Variants } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { WorkoutSummarySkeleton } from "../components/workout-summary/WorkoutSummarySkeleton";
import { path } from "@/core/constants/path.ts";
import { NotificationPromptCard } from "@/features/notifications/components/NotificationPromptCard.tsx";
import { useWorkoutSummaryLogic } from "@/features/workouts/hooks/useWorkoutSummaryLogic.ts";
import { useStreakData } from "@/features/user/hooks/useStreakData";
import { formatDateShort } from "@/core/utils/formatters";
import { formatDurationExtensive } from "@/core/utils/time";
import { UNITS } from "@/core/constants/units";
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

    // No modo simplificado as reps são presumidas, e sem peso nenhum informado não há
    // volume a mostrar. "0 kg" diria que a pessoa não levantou nada.
    const isSimple = workoutSession.trackingMode === "SIMPLE";

    const lead = stats.totalVolume > 0
        ? {
            label: isSimple ? "Volume estimado" : "Volume total",
            value: `${Math.round(stats.totalVolume).toLocaleString("pt-BR")} ${UNITS.WEIGHT}`,
            deltaPercent: isSimple ? null : stats.volumeDeltaPercent,
        }
        : undefined;

    const metrics = [
        { label: "Duração", value: formatDurationExtensive(stats.duration) },
        { label: "Sets", value: String(stats.totalSets) },
        { label: "Exercícios", value: String(stats.completedExercises.length) },
    ];

    return (
        <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-3 pb-[184px]"
        >
            <motion.header variants={staggerItem} className="pt-2 pb-1">
                <p className="flex items-center gap-1.5 text-[13px] font-medium text-success">
                    <CheckCircle2 className="size-4" aria-hidden />
                    Treino concluído
                </p>
                <h1 className="text-[24px] font-semibold tracking-[-0.03em] leading-tight mt-1.5">{workout.name}</h1>
                {workoutSession.completedAt && (
                    <p className="text-[13px] text-muted-foreground mt-1">
                        {formatDateShort(workoutSession.completedAt)}
                    </p>
                )}
                {streakData && <StreakBanner streak={streakData} />}
            </motion.header>

            <SummaryPRBanner newPRs={stats.newPRs} />
            <SummaryMetricsGrid lead={lead} metrics={metrics} />
            <NotificationPromptCard completedAt={workoutSession.completedAt} />
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
                    Concluir
                </Button>
            </div>
        </motion.div>
    );
};

export default WorkoutSummaryPage;
