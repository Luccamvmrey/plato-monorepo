import { motion, type Variants } from "framer-motion";
import { ChevronLeft, TrendingUp, Trophy } from "lucide-react";
import { ExerciseAnalyticsSkeleton } from "../components/exercise-analytics/ExerciseAnalyticsSkeleton";
import { MuscleBadge } from "@/core/components/MuscleBadge";
import { AnalyticsChart } from "../components/exercise-analytics/AnalyticsChart";
import { ExecutionHistoryList } from "../components/exercise-analytics/ExecutionHistoryList";
import { useExerciseAnalytics, type AnalyticsMetric } from "@/features/workouts/hooks/useExerciseAnalytics";
import { cn } from "@/lib/utils";

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

const METRIC_LABEL: Record<AnalyticsMetric, string> = {
    strength: "Força",
    load: "Carga",
    volume: "Volume",
};

const METRIC_EMPTY: Record<AnalyticsMetric, string> = {
    strength: "Curva de força",
    load: "Curva de carga",
    volume: "Curva de volume",
};

const formatKg = (value: number) => value.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

/** A mesma barra aparecia em três estados da página — carregando, vazio e cheio. */
const TopBar = ({ title, onBack }: { title?: string; onBack: () => void }) => (
    <div className="flex items-center gap-2 py-2">
        <button
            type="button"
            aria-label="Voltar"
            onClick={onBack}
            className="w-8 h-8 -ml-1 rounded-lg flex items-center justify-center shrink-0
                       text-muted-foreground hover:text-foreground transition-colors relative tap-target"
        >
            <ChevronLeft className="size-5" />
        </button>
        <h1 className="text-[24px] font-semibold tracking-[-0.03em] leading-tight min-w-0">{title ?? "Exercício"}</h1>
    </div>
);

const ExerciseAnalyticsPage = ({ params }: { params: { id: string } }) => {
    const exerciseId = parseInt(params.id);
    const {
        isLoading,
        isEmpty,
        exerciseInfo,
        records,
        executions,
        series,
        metric,
        setMetric,
        hasStrength,
        hasLoad,
        currentStrength,
        trend,
        goBack,
    } = useExerciseAnalytics(exerciseId);

    if (isLoading) {
        return (
            // A barra é estática: não há motivo para ela esperar as queries.
            <div className="flex flex-col mb-[100px]">
                <TopBar onBack={goBack} />
                <ExerciseAnalyticsSkeleton />
            </div>
        );
    }

    if (isEmpty) {
        return (
            <div className="flex flex-col gap-3 mb-[100px]">
                <TopBar onBack={goBack} />
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center
                                bg-card border border-border rounded-xl gap-3">
                    <TrendingUp className="size-8 text-muted-foreground" />
                    <p className="text-[14px] text-muted-foreground">
                        Este exercício ainda não foi feito em nenhuma sessão concluída.
                    </p>
                    <button
                        type="button"
                        onClick={goBack}
                        className="text-[14px] text-primary font-medium relative tap-target"
                    >
                        Voltar para o histórico
                    </button>
                </div>
            </div>
        );
    }

    const maxLoad = records?.find((record) => record.type === "WEIGHT")?.value;
    const maxVolume = records?.find((record) => record.type === "VOLUME")?.value;

    // Só oferece a aba que tem como ter dado: quem treina só no modo simples não tem RPE,
    // e uma aba de força vazia para sempre não ajudaria em nada.
    const metrics: AnalyticsMetric[] = hasStrength ? ["strength", "load", "volume"] : hasLoad ? ["load"] : [];

    return (
        <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-3 mb-[100px]"
        >
            <motion.div variants={staggerItem} className="flex flex-col gap-2">
                <TopBar title={exerciseInfo?.name} onBack={goBack} />
                {exerciseInfo && (
                    <div className="pl-9">
                        <MuscleBadge muscle={exerciseInfo.targetMuscle} />
                    </div>
                )}
            </motion.div>

            {/* A pergunta da tela: "estou ficando mais forte?" */}
            <motion.section variants={staggerItem} className="bg-card border border-border rounded-xl p-4 flex flex-col gap-4 mt-1">
                {currentStrength !== null ? (
                    <div>
                        <p className="text-[13px] text-muted-foreground">Força estimada (e1RM)</p>
                        <p className="text-[40px] font-semibold tracking-[-0.04em] leading-none tabular-nums mt-1.5">
                            {formatKg(Math.round(currentStrength))}
                            <span className="text-[17px] font-medium tracking-normal text-muted-foreground ml-1.5">kg</span>
                        </p>
                        {trend && (
                            <p className={cn(
                                "text-[13px] font-medium mt-2 tabular-nums",
                                trend.delta >= 0 ? "text-success" : "text-destructive"
                            )}>
                                {trend.delta >= 0 ? "+" : "−"}{formatKg(Math.abs(Math.round(trend.delta * 10) / 10))} kg
                                <span className="font-normal text-muted-foreground">
                                    {" "}em {trend.weeks} {trend.weeks === 1 ? "semana" : "semanas"}
                                </span>
                            </p>
                        )}
                    </div>
                ) : (
                    <div>
                        <p className="text-[15px] font-medium">
                            {executions.length} {executions.length === 1 ? "sessão" : "sessões"} no modo simples
                        </p>
                        <p className="text-[13px] text-muted-foreground mt-1">
                            A curva de força precisa de carga, reps e RPE de cada série, registrados no modo completo.
                        </p>
                    </div>
                )}

                {metrics.length > 1 && (
                    <div role="tablist" aria-label="Métrica do gráfico" className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
                        {metrics.map((item) => (
                            <button
                                key={item}
                                type="button"
                                role="tab"
                                aria-selected={metric === item}
                                onClick={() => setMetric(item)}
                                className={cn(
                                    "h-9 rounded-md text-[13px] font-medium transition-colors",
                                    metric === item ? "bg-card text-foreground" : "text-muted-foreground"
                                )}
                            >
                                {METRIC_LABEL[item]}
                            </button>
                        ))}
                    </div>
                )}

                {metrics.length > 0 && (
                    <AnalyticsChart data={series[metric]} emptyLabel={METRIC_EMPTY[metric]} />
                )}
            </motion.section>

            {(maxLoad !== undefined || maxVolume !== undefined) && (
                <motion.section
                    variants={staggerItem}
                    aria-label="Recordes pessoais"
                    className="bg-card border border-border rounded-xl p-4 grid grid-cols-2 gap-4"
                >
                    {[
                        { label: "Carga máxima", value: maxLoad },
                        { label: "Volume máximo", value: maxVolume },
                    ].map(({ label, value }) => (
                        <div key={label}>
                            <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                                <Trophy className="size-3.5 text-pr shrink-0" aria-hidden />
                                {label}
                            </p>
                            <p className="text-[22px] font-semibold tracking-[-0.03em] leading-none tabular-nums mt-2">
                                {value !== undefined ? formatKg(value) : "—"}
                                {value !== undefined && (
                                    <span className="text-[13px] font-normal tracking-normal text-muted-foreground ml-1">kg</span>
                                )}
                            </p>
                        </div>
                    ))}
                </motion.section>
            )}

            <motion.div variants={staggerItem}>
                <ExecutionHistoryList executions={executions} />
            </motion.div>
        </motion.div>
    );
};

export default ExerciseAnalyticsPage;
