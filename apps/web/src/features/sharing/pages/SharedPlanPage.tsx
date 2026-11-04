import { Link2Off, Plus } from "lucide-react";
import { useParams } from "wouter";
import type { MuscleGroup } from "@plato/database/generated/prisma/enums";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { muscleGroupTranslation } from "@/core/utils/translations";
import SharedWorkoutCard from "@/features/sharing/components/SharedWorkoutCard.tsx";
import { useSharedPlanPage } from "@/features/sharing/hooks/useSharedPlanPage.ts";

const MAX_MUSCLES_SHOWN = 5;

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

const Shell = ({ children }: { children: React.ReactNode }) => (
    <main className="min-h-dvh w-screen bg-background overflow-y-auto px-4 pt-4">
        <div className="mx-auto max-w-lg flex flex-col gap-5">
            {/* Quem chega por um link pode nunca ter ouvido falar do app. */}
            <div className="flex items-center gap-2 text-[13px] text-muted-foreground min-h-6">
                <img src="/icon.svg" alt="" className="size-5 shrink-0" />
                <span className="font-semibold text-foreground">Plato</span>
                <span className="truncate">Registre treinos e acompanhe sua carga</span>
            </div>
            {children}
        </div>
    </main>
);

const CenteredMessage = ({ title, description, action, onAction }: {
    title: string;
    description: string;
    action: string;
    onAction: () => void;
}) => (
    <Shell>
        <div className="flex flex-col items-center text-center gap-4 pt-24">
            <Link2Off className="size-9 text-muted-foreground opacity-40" aria-hidden />
            <div className="flex flex-col gap-1.5">
                <h1 className="text-[22px] font-semibold tracking-[-0.03em]">{title}</h1>
                <p className="text-[14px] text-muted-foreground">{description}</p>
            </div>
            <Button onClick={onAction} className="h-11 px-5 font-medium mt-2">{action}</Button>
        </div>
    </Shell>
);

const SharedPlanPage = () => {
    const { token = "" } = useParams<{ token: string }>();
    const {
        plan,
        summary,
        isLoading,
        isUnavailable,
        hasLoadError,
        retry,
        isAuthenticated,
        isAdding,
        handleAdd,
        handleLogin,
        goHome,
    } = useSharedPlanPage(token);

    if (isLoading) {
        return (
            <Shell>
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-64 w-full rounded-xl" />
            </Shell>
        );
    }

    if (isUnavailable) {
        return (
            <CenteredMessage
                title="Este link não está disponível"
                description="Quem compartilhou pode ter desativado o link."
                action="Ir para o Plato"
                onAction={goHome}
            />
        );
    }

    if (hasLoadError || !plan || !summary) {
        return (
            <CenteredMessage
                title="Não foi possível abrir o link"
                description="Confira sua conexão e tente de novo."
                action="Tentar de novo"
                onAction={retry}
            />
        );
    }

    const isProgram = plan.kind === "PROGRAM";
    const muscles = summary.muscles.slice(0, MAX_MUSCLES_SHOWN);
    const largestMuscle = muscles[0]?.sets ?? 1;

    const meta = [
        plan.focusLabel,
        plan.sessionsPerWeek ? `${plan.sessionsPerWeek}x por semana` : null,
        isProgram ? plural(plan.workouts.length, "treino", "treinos") : plural(summary.totalExercises, "exercício", "exercícios"),
        plural(summary.totalSets, "série", "séries"),
    ].filter(Boolean).join(" · ");

    return (
        <Shell>
            <header className="flex flex-col gap-1">
                <p className="text-[13px] font-medium text-primary">
                    {plan.isCurated
                        ? "Sugerido pelo Plato"
                        : `${isProgram ? "Programa compartilhado" : "Treino compartilhado"} com você`}
                </p>
                <h1 className="text-[24px] font-semibold tracking-[-0.03em] leading-tight">{plan.name}</h1>
                {plan.description && <p className="text-[14px] text-muted-foreground mt-1">{plan.description}</p>}
                <p className="text-[13px] text-muted-foreground mt-1 tabular-nums">{meta}</p>
            </header>

            <section aria-label="Grupos musculares mais trabalhados" className="flex flex-col gap-2.5">
                <h2 className="text-[13px] font-medium text-muted-foreground">Grupos mais trabalhados, em séries</h2>
                {muscles.map((muscle) => (
                    <div key={muscle.muscle} className="flex items-center gap-3 text-[13px]">
                        <span className="w-28 shrink-0">
                            {muscleGroupTranslation[muscle.muscle as MuscleGroup]}
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${(muscle.sets / largestMuscle) * 100}%` }}
                            />
                        </div>
                        <span className="w-6 text-right text-muted-foreground tabular-nums">{muscle.sets}</span>
                    </div>
                ))}
            </section>

            <div className="flex flex-col gap-3">
                {plan.workouts.map((workout) => (
                    <SharedWorkoutCard key={workout.orderIndex} workout={workout} showHeader={isProgram} />
                ))}
            </div>

            {plan.isCurated && (
                <p className="text-[13px] text-muted-foreground">
                    Este é um ponto de partida. Ajuste as cargas à sua realidade e procure orientação profissional se tiver alguma limitação.
                </p>
            )}

            {/* A altura reserva o espaço do rodapé fixo: sem ela, ele cobriria o fim da lista. */}
            <div aria-hidden className={isAuthenticated ? "h-24" : "h-36"} />

            <div className="fixed inset-x-0 bottom-0 bg-background border-t border-border px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
                <div className="mx-auto max-w-lg flex flex-col gap-1">
                    <Button
                        onClick={handleAdd}
                        disabled={isAdding}
                        className="w-full h-[52px] gap-2 text-[15px] font-medium tracking-[-0.01em]"
                    >
                        {isAdding ? <Spinner data-icon="inline-start" /> : <Plus data-icon="inline-start" />}
                        {isAuthenticated ? "Adicionar aos meus treinos" : "Criar conta grátis e adicionar"}
                    </Button>
                    {!isAuthenticated && (
                        <Button variant="link" onClick={handleLogin} className="w-full h-10 text-[13px] text-muted-foreground">
                            Já tenho conta
                        </Button>
                    )}
                </div>
            </div>
        </Shell>
    );
};

export default SharedPlanPage;
