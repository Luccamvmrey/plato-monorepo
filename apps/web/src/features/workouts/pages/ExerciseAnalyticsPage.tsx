import { motion, type Variants } from "framer-motion";
import { ChevronLeft, TrendingUp, Dumbbell, Trophy } from "lucide-react";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { MuscleBadge } from "@/core/components/MuscleBadge";
import { AnalyticsChart } from "../components/exercise-analytics/AnalyticsChart";
import { ExecutionHistoryList } from "../components/exercise-analytics/ExecutionHistoryList";
import { useExerciseAnalytics } from "@/features/workouts/hooks/useExerciseAnalytics";

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

const CHART_COLORS = {
    e1rm: "var(--color-primary)",
    volume: "var(--color-success)",
};

const ExerciseAnalyticsPage = ({ params }: { params: { id: string } }) => {
    const exerciseId = parseInt(params.id);
    const { isLoading, exerciseInfo, records, chartData, exerciseData, goBack } =
        useExerciseAnalytics(exerciseId);

    if (isLoading) return <LoadingOverlay isLoading={true} />;

    if (exerciseData.length === 0) {
        return (
            <div className="flex flex-col mb-[100px] -mx-4 -mt-4">
                <div className="flex items-center gap-3 px-4 pt-4 pb-2">
                    <button
                        onClick={goBack}
                        className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center
                                   text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <h1 className="text-[15px] font-medium tracking-[-0.02em]">
                        Análise de Exercício
                    </h1>
                </div>
                <div className="mx-4 mt-8 flex flex-col items-center justify-center py-12 text-center
                                bg-card border border-border rounded-xl gap-3">
                    <TrendingUp className="w-10 h-10 text-muted-foreground opacity-20" />
                    <p className="text-[13px] text-muted-foreground">
                        Este exercício ainda não foi realizado em nenhuma sessão concluída.
                    </p>
                    <button
                        onClick={goBack}
                        className="text-[13px] text-primary font-medium mt-1"
                    >
                        Voltar para Histórico
                    </button>
                </div>
            </div>
        );
    }

    const e1rmData = chartData.map(d => ({ date: d.date, value: d.maxE1RM }));
    const volumeData = chartData.map(d => ({ date: d.date, value: d.totalVolume }));

    return (
        <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="flex flex-col mb-[100px] -mx-4 -mt-4"
        >
            {/* Top bar */}
            <div className="flex items-center gap-3 px-4 pt-4 pb-2">
                <button
                    onClick={goBack}
                    className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center
                               text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <h1 className="text-[15px] font-medium tracking-[-0.02em]">
                    Análise de Exercício
                </h1>
            </div>

            {/* Hero */}
            <motion.div variants={staggerItem} className="px-4 pt-2 pb-4">
                <h2 className="text-[22px] font-medium tracking-[-0.03em] text-foreground mb-2">
                    {exerciseInfo?.name}
                </h2>
                {exerciseInfo && (
                    <MuscleBadge muscle={exerciseInfo.targetMuscle} />
                )}
            </motion.div>

            {/* Recordes */}
            <motion.div
                variants={staggerItem}
                className="mx-4 mb-4 bg-card border border-border rounded-xl p-4"
            >
                <div className="flex items-center gap-2 mb-3">
                    <Trophy className="w-4 h-4 text-pr flex-shrink-0" />
                    <p className="text-[13px] font-medium text-foreground">Recordes pessoais</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {[
                        { label: "Carga máxima", value: records?.find(r => r.type === "WEIGHT")?.value ?? 0, unit: "kg" },
                        { label: "Volume máximo", value: records?.find(r => r.type === "VOLUME")?.value ?? 0, unit: "kg" },
                    ].map(({ label, value, unit }) => (
                        <div key={label}>
                            <p className="text-[10px] font-medium tracking-[0.05em] uppercase
                                          text-muted-foreground mb-1">
                                {label}
                            </p>
                            <p className="text-[22px] font-medium tracking-[-0.03em] leading-none">
                                {value}
                                <span className="text-[13px] font-normal text-muted-foreground ml-1">
                                    {unit}
                                </span>
                            </p>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Gráfico e1RM */}
            <motion.div
                variants={staggerItem}
                className="mx-4 mb-4 bg-card border border-border rounded-xl p-4"
            >
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    <p className="text-[13px] font-medium text-foreground">Evolução de e1RM</p>
                    <span className="text-[11px] text-muted-foreground ml-auto">Brzycki + RPE</span>
                </div>
                <AnalyticsChart
                    data={e1rmData}
                    color={CHART_COLORS.e1rm}
                    gradientId="e1rmGrad"
                />
            </motion.div>

            {/* Gráfico volume */}
            <motion.div
                variants={staggerItem}
                className="mx-4 mb-4 bg-card border border-border rounded-xl p-4"
            >
                <div className="flex items-center gap-2 mb-4">
                    <Dumbbell className="w-4 h-4 text-muted-foreground" />
                    <p className="text-[13px] font-medium text-foreground">Volume por sessão</p>
                    <span className="text-[11px] text-muted-foreground ml-auto">Tonnage</span>
                </div>
                <AnalyticsChart
                    data={volumeData}
                    color={CHART_COLORS.volume}
                    gradientId="volumeGrad"
                />
            </motion.div>

            {/* Execuções */}
            <motion.div variants={staggerItem}>
                <ExecutionHistoryList data={exerciseData} />
            </motion.div>
        </motion.div>
    );
};

export default ExerciseAnalyticsPage;
