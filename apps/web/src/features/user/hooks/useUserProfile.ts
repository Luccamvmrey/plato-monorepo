import { useQuery } from "@tanstack/react-query";
import api from "@/core/api";

export interface UserProfile {
    id: number;
    name: string;
    email: string;
    createdAt: string;
    totalSessions: number;
    lifetimeVolume: number;
    totalPRs: number;
}

export const useUserProfile = () => {
    return useQuery<UserProfile>({
        queryKey: ["user-profile"],
        queryFn: async () => {
            const response = await api.get("/users/profile");
            return response.data;
        }
    });
};
