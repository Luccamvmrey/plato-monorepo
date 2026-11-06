import type { AdminMetrics } from "@plato/shared";
import api from "@/core/api";

export const AdminService = {
    getMetrics: async () => {
        const response = await api.get<AdminMetrics>("/admin/metrics");

        return response.data;
    },
};
