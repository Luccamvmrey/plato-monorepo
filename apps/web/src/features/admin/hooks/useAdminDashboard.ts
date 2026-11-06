import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useLocation } from "wouter";
import { path } from "@/core/constants/path.ts";
import { AdminService } from "../admin.service.ts";

export type WeeklyMetric = "activeUsers" | "sessions" | "signups";

const STALE_MS = 60_000;

export const useAdminDashboard = () => {
    const [, navigate] = useLocation();
    const [metric, setMetric] = useState<WeeklyMetric>("activeUsers");

    const metricsQuery = useQuery({
        queryKey: ["admin-metrics"],
        queryFn: AdminService.getMetrics,
        staleTime: STALE_MS,
        retry: false,
    });

    return {
        metrics: metricsQuery.data,
        isLoading: metricsQuery.isLoading,
        isForbidden: isAxiosError(metricsQuery.error) && metricsQuery.error.response?.status === 403,
        hasError: metricsQuery.isError,
        retry: () => void metricsQuery.refetch(),
        metric,
        setMetric,
        goBack: () => navigate(path.USER_PROFILE),
    };
};
