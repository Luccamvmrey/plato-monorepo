import { useQuery } from "@tanstack/react-query";
import api from "@/core/api";

export interface WeekDay {
    date: string;
    dayOfWeek: number;
    status: 'trained' | 'rest_used' | 'future';
}

export interface StreakData {
    currentStreak: number;
    restDaysUsedThisWeek: number;
    weekDays: WeekDay[];
}

export const useStreakData = () => {
    return useQuery<StreakData>({
        queryKey: ['user-streak'],
        queryFn: async () => {
            const response = await api.get('/users/streak');
            return response.data;
        },
    });
};
