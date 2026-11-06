import { useMemo, useState } from "react";
import { filterAdminUsers, type AdminFeature, type AdminUserStatus } from "@plato/shared";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useLocation } from "wouter";
import { path } from "@/core/constants/path.ts";
import { AdminService } from "../admin.service.ts";

export type WeeklyMetric = "activeUsers" | "sessions" | "signups" | "completionRate";
export type ChartWeeks = 4 | 12 | 26;

const STALE_MS = 60_000;
const NO_USERS: never[] = [];

export const STATUS_OPTIONS: { value: AdminUserStatus; label: string }[] = [
    { value: "ALL", label: "Todas" },
    { value: "ACTIVE", label: "Ativas em 28 dias" },
    { value: "INACTIVE", label: "Paradas há 28 dias" },
    { value: "OPEN_SESSION", label: "Treino em aberto" },
    { value: "NEVER_TRAINED", label: "Nunca treinaram" },
    { value: "NEW", label: "Novas em 7 dias" },
];

export const useAdminDashboard = () => {
    const [, navigate] = useLocation();
    const [metric, setMetric] = useState<WeeklyMetric>("activeUsers");
    const [chartWeeks, setChartWeeks] = useState<ChartWeeks>(12);
    const [status, setStatus] = useState<AdminUserStatus>("ALL");
    const [feature, setFeature] = useState<AdminFeature | "ALL">("ALL");
    const [search, setSearch] = useState("");

    const metricsQuery = useQuery({
        queryKey: ["admin-metrics"],
        queryFn: AdminService.getMetrics,
        staleTime: STALE_MS,
        retry: false,
    });

    const metrics = metricsQuery.data;
    const users = metrics?.users ?? NO_USERS;

    const { filteredUsers, statusCounts } = useMemo(() => {
        const now = new Date();

        return {
            filteredUsers: filterAdminUsers(users, { status, feature, search }, now),
            // Cada contagem respeita os outros filtros, para bater com o que a lista vai mostrar.
            statusCounts: Object.fromEntries(
                STATUS_OPTIONS.map(({ value }) => [
                    value,
                    filterAdminUsers(users, { status: value, feature, search }, now).length,
                ])
            ) as Record<AdminUserStatus, number>,
        };
    }, [users, status, feature, search]);

    return {
        metrics,
        isLoading: metricsQuery.isLoading,
        isForbidden: isAxiosError(metricsQuery.error) && metricsQuery.error.response?.status === 403,
        hasError: metricsQuery.isError,
        retry: () => void metricsQuery.refetch(),
        goBack: () => navigate(path.USER_PROFILE),
        chart: {
            metric,
            setMetric,
            weeks: chartWeeks,
            setWeeks: setChartWeeks,
            // O servidor manda o maior período; aqui só se recorta o fim da lista.
            data: metrics?.weekly.slice(-chartWeeks) ?? [],
        },
        userList: {
            users: filteredUsers,
            totalUsers: users.length,
            status,
            setStatus,
            statusCounts,
            feature,
            setFeature,
            search,
            setSearch,
            hasFilters: status !== "ALL" || feature !== "ALL" || search !== "",
            clearFilters: () => {
                setStatus("ALL");
                setFeature("ALL");
                setSearch("");
            },
        },
    };
};
