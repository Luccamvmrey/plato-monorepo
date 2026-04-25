import { useQuery } from "@tanstack/react-query";
import api from "@/core/api";

export interface UserStats {
    peakStrength: Record<string, number>;
    volumeLeaders: Record<string, { name: string, volume: number }>;
    distribution: Array<{ muscle: string, percentage: number }>;
}

export const useUserStats = () => {
    return useQuery<UserStats>({
        queryKey: ["user-stats"],
        queryFn: async () => {
            const response = await api.get("/users/stats");
            return response.data;
        }
    });
};
