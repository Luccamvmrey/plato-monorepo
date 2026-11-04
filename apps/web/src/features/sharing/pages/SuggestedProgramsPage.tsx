import { ArrowLeft, ChevronRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { path } from "@/core/constants/path.ts";
import { useFeaturedPlans } from "@/features/sharing/hooks/useFeaturedPlans.ts";

const SuggestedProgramsPage = () => {
    const [, navigate] = useLocation();
    const { plans, isLoading, hasError, hasPlans } = useFeaturedPlans();

    return (
        <main className="min-h-dvh w-screen bg-background overflow-y-auto px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+2rem)]">
            <div className="mx-auto max-w-lg flex flex-col gap-3">
                <div className="flex items-center gap-1 py-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full relative tap-target -ml-2"
                        onClick={() => navigate(path.LOGIN)}
                        aria-label="Voltar"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-[24px] font-semibold tracking-[-0.03em]">Programas sugeridos</h1>
                </div>

                <p className="text-[14px] text-muted-foreground px-1">
                    Rotações prontas para começar sem montar nada. Depois de adicionar, tudo pode ser editado.
                </p>

                {isLoading && (
                    <>
                        <Skeleton className="h-24 w-full rounded-xl" />
                        <Skeleton className="h-24 w-full rounded-xl" />
                    </>
                )}

                {!isLoading && (hasError || !hasPlans) && (
                    <p className="text-[14px] text-muted-foreground px-1 py-8 text-center">
                        {hasError ? "Não foi possível carregar os programas agora." : "Os programas sugeridos chegam em breve."}
                    </p>
                )}

                {plans.map((plan) => (
                    <Link
                        key={plan.token}
                        href={`${path.SHARED}/${plan.token}`}
                        className="flex items-center gap-3 rounded-xl bg-card border border-border p-4 transition-transform active:scale-[0.98]"
                    >
                        <div className="flex-1 min-w-0">
                            <h2 className="text-[17px] font-semibold tracking-[-0.02em] leading-tight">{plan.name}</h2>
                            {plan.description && (
                                <p className="text-[13px] text-muted-foreground mt-1 line-clamp-2">{plan.description}</p>
                            )}
                            <p className="text-[13px] text-muted-foreground mt-1 tabular-nums">
                                {[
                                    plan.focusLabel,
                                    plan.sessionsPerWeek ? `${plan.sessionsPerWeek}x por semana` : null,
                                    `${plan.workoutCount} ${plan.workoutCount === 1 ? "treino" : "treinos"}`,
                                ].filter(Boolean).join(" · ")}
                            </p>
                        </div>
                        <ChevronRight className="size-4 text-muted-foreground shrink-0" aria-hidden />
                    </Link>
                ))}
            </div>
        </main>
    );
};

export default SuggestedProgramsPage;
