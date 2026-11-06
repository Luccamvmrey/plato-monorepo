import { ChevronLeft } from "lucide-react";
import { InlineErrorBanner } from "@/core/components/InlineErrorBanner.tsx";
import NotFoundPage from "@/core/pages/NotFoundPage.tsx";
import { AdminDashboardSkeleton } from "../components/AdminDashboardSkeleton.tsx";
import { FeatureUsage } from "../components/FeatureUsage.tsx";
import { NotificationStats } from "../components/NotificationStats.tsx";
import { UserActivityList } from "../components/UserActivityList.tsx";
import { WeeklyChart } from "../components/WeeklyChart.tsx";
import { useAdminDashboard } from "../hooks/useAdminDashboard.ts";

const AdminDashboardPage = () => {
    const { metrics, isLoading, isForbidden, hasError, retry, goBack, chart, userList } = useAdminDashboard();

    // Para quem não é admin, esta tela simplesmente não existe.
    if (isForbidden) return <NotFoundPage />;

    return (
        <div className="flex flex-col gap-3 mb-[100px]">
            <div className="flex items-center gap-2 py-2">
                <button
                    type="button"
                    aria-label="Voltar"
                    onClick={goBack}
                    className="w-8 h-8 -ml-1 rounded-lg flex items-center justify-center shrink-0
                               text-muted-foreground hover:text-foreground transition-colors relative tap-target"
                >
                    <ChevronLeft className="size-5" />
                </button>
                <h1 className="text-[24px] font-semibold tracking-[-0.03em] leading-tight">Painel de uso</h1>
            </div>

            {isLoading && <AdminDashboardSkeleton />}

            {hasError && (
                <div className="flex flex-col gap-3">
                    <InlineErrorBanner message="Não foi possível carregar o painel." />
                    <button type="button" onClick={retry} className="text-[14px] text-primary font-medium self-center relative tap-target">
                        Tentar de novo
                    </button>
                </div>
            )}

            {metrics && (
                <>
                    <section aria-label="Resumo" className="grid grid-cols-2 gap-3">
                        {[
                            { label: "Ativos em 7 dias", value: metrics.summary.active7d },
                            { label: "Ativos em 28 dias", value: metrics.summary.active28d },
                            { label: "Treinos nesta semana", value: metrics.summary.sessionsThisWeek },
                            { label: "Contas criadas", value: metrics.summary.users },
                            {
                                label: "Treinos concluídos em 28 dias",
                                value: metrics.summary.completionRate28d === null ? "—" : `${metrics.summary.completionRate28d}%`,
                                detail: metrics.summary.autoCompleted28d > 0
                                    ? `${metrics.summary.autoCompleted28d} fechados pelo app`
                                    : undefined,
                            },
                            { label: "Pessoas com treino em aberto", value: metrics.summary.usersWithOpenSession },
                        ].map(({ label, value, detail }: { label: string; value: number | string; detail?: string }) => (
                            <div key={label} className="bg-card border border-border rounded-xl p-4">
                                <p className="text-[32px] font-semibold tracking-[-0.04em] leading-none tabular-nums">{value}</p>
                                <p className="text-[13px] text-muted-foreground mt-2">{label}</p>
                                {detail && <p className="text-[13px] text-muted-foreground mt-0.5">{detail}</p>}
                            </div>
                        ))}
                    </section>

                    <WeeklyChart
                        weekly={chart.data}
                        metric={chart.metric}
                        onMetricChange={chart.setMetric}
                        weeks={chart.weeks}
                        onWeeksChange={chart.setWeeks}
                    />
                    <UserActivityList
                        users={userList.users}
                        totalUsers={userList.totalUsers}
                        status={userList.status}
                        onStatusChange={userList.setStatus}
                        statusCounts={userList.statusCounts}
                        feature={userList.feature}
                        onFeatureChange={userList.setFeature}
                        search={userList.search}
                        onSearchChange={userList.setSearch}
                        hasFilters={userList.hasFilters}
                        onClearFilters={userList.clearFilters}
                    />
                    <FeatureUsage features={metrics.features} totalUsers={metrics.summary.users} />
                    <NotificationStats notifications={metrics.notifications} />
                </>
            )}
        </div>
    );
};

export default AdminDashboardPage;
