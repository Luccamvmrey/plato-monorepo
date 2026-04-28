import { motion, type Variants } from "framer-motion";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { LoadingOverlay } from "@/components/ui/loading-overlay.tsx";
import { MuscleBadge } from "@/core/components/MuscleBadge.tsx";
import { cn } from "@/lib/utils.ts";
import { path } from "@/core/constants/path.ts";
import { useWorkoutSummaryLogic } from "@/features/workouts/hooks/useWorkoutSummaryLogic.ts";

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

function formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
}

function formatMinutes(seconds: number): string {
    if (seconds >= 3600) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m.toString().padStart(2, "0")}m`;
    }
    return `${Math.floor(seconds / 60)} min`;
}

const WorkoutSummaryPage = () => {
    const { navigate, workoutSession, workout, stats, handleFinish, isLoading } =
        useWorkoutSummaryLogic();

    if (isLoading) {
        return <LoadingOverlay isLoading={true} />;
    }

    if (!workoutSession || !workout || !stats) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center gap-4">
                <p className="text-muted-foreground">Dados do treino não encontrados.</p>
                <Button onClick={() => navigate(path.WORKOUTS)}>Voltar</Button>
            </div>
        );
    }

    const metrics = [
        { label: "Volume", value: String(stats.totalVolume), unit: "kg" },
        { label: "Duração", value: formatMinutes(stats.duration), unit: null },
        { label: "Sets", value: String(stats.totalSets), unit: null },
    ];

    return (
        <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="flex flex-col pb-24 overflow-y-auto"
        >
            {/* Header */}
            <motion.div variants={staggerItem} className="pt-6 pb-4 px-4">
                <p className="text-[13px] font-medium text-muted-foreground uppercase tracking-[0.05em] mb-1">
                    Treino finalizado
                </p>
                <h1 className="text-[22px] font-medium tracking-[-0.03em] text-foreground">
                    {workout.name}
                </h1>
                {workoutSession.completedAt && (
                    <p className="text-[13px] text-muted-foreground mt-1">
                        {formatDate(workoutSession.completedAt)}
                        {stats.duration > 0 && ` · ${formatMinutes(stats.duration)}`}
                    </p>
                )}
            </motion.div>

            {/* PR Banner */}
            {stats.newPRs.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="mx-4 mb-4 p-4 rounded-xl bg-pr-subtle border border-pr/20 flex items-start gap-3"
                >
                    <Trophy className="w-5 h-5 text-pr flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-[13px] font-medium text-pr-subtle-fg mb-1">
                            {stats.newPRs.length === 1
                                ? "Novo recorde pessoal!"
                                : `${stats.newPRs.length} novos recordes!`}
                        </p>
                        {stats.newPRs.map(pr => (
                            <p key={pr.exerciseId} className="text-[12px] text-pr-subtle-fg/80">
                                {pr.exerciseName} —{" "}
                                {pr.previousMax !== null
                                    ? `${pr.previousMax}kg → ${pr.newMax}kg`
                                    : `Novo recorde: ${pr.newMax}kg`}
                            </p>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Metrics grid */}
            <motion.div variants={staggerItem} className="grid grid-cols-3 gap-3 mx-4 mb-4">
                {metrics.map(m => (
                    <div
                        key={m.label}
                        className="bg-card border border-border rounded-xl p-3 flex flex-col gap-1"
                    >
                        <p className="text-[11px] font-medium tracking-[0.04em] uppercase text-muted-foreground">
                            {m.label}
                        </p>
                        <p className="text-[22px] font-medium tracking-[-0.03em] text-foreground leading-none">
                            {m.value}
                            {m.unit && (
                                <span className="text-[13px] font-normal text-muted-foreground ml-1">
                                    {m.unit}
                                </span>
                            )}
                        </p>
                    </div>
                ))}
            </motion.div>

            {/* Exercícios realizados */}
            {stats.completedExercises.length > 0 && (
                <motion.div
                    variants={staggerItem}
                    className="mx-4 mb-4 bg-card border border-border rounded-xl overflow-hidden"
                >
                    <div className="px-4 py-3 border-b border-border">
                        <p className="text-[13px] font-medium text-foreground">Exercícios realizados</p>
                    </div>
                    {stats.completedExercises.map((ex, i) => (
                        <div
                            key={ex.id}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3",
                                i < stats.completedExercises.length - 1 && "border-b border-border"
                            )}
                        >
                            <span className="text-[13px] text-foreground flex-1 min-w-0 truncate">
                                {ex.name}
                            </span>
                            <MuscleBadge muscle={ex.muscleGroup} />
                            <span className="text-[12px] text-muted-foreground ml-2 flex-shrink-0">
                                {ex.sets}×{ex.reps}
                            </span>
                        </div>
                    ))}
                </motion.div>
            )}

            {/* Distribuição de volume */}
            {stats.volumeByGroup.length > 0 && (
                <motion.div
                    variants={staggerItem}
                    className="mx-4 mb-4 bg-card border border-border rounded-xl p-4"
                >
                    <p className="text-[13px] font-medium text-foreground mb-3">
                        Distribuição de volume
                    </p>
                    {stats.volumeByGroup.map(({ group, volume, percentage }) => (
                        <div key={group} className="mb-3 last:mb-0">
                            <div className="flex items-center justify-between mb-1.5">
                                <MuscleBadge muscle={group} />
                                <span className="text-[12px] text-muted-foreground">
                                    {Math.round(volume)}kg · {Math.round(percentage)}%
                                </span>
                            </div>
                            <div className="h-[3px] bg-muted rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{
                                        background: `var(--muscle-${group.toLowerCase().replace(/_/g, "-")})`,
                                    }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
                                />
                            </div>
                        </div>
                    ))}
                </motion.div>
            )}

            {/* Fixed footer */}
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
