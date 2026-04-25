import api from "@/core/api";
import type { GetUserWorkoutsResponse, Workout } from "@/features/workouts/workout.types.ts";

export interface WorkoutPayload {
    name: string;
    description?: string;
    exercises: {
        exerciseId: number;
        targetSets: number;
        targetReps: number;
        orderIndex: number;
    }[];
}

export interface UpdateWorkoutPayload {
    id: string;
    payload: WorkoutPayload;
}

export const WorkoutService = {
    getUserWorkouts: async (isActive?: boolean) => {
        const params = isActive !== undefined ? { isActive } : {};
        const { data } = await api.get<GetUserWorkoutsResponse>("/workouts", { params });
        return data;
    },

    getById: async (id: string) => {
        const { data } = await api.get<Workout>(`/workouts/${id}`);
        return data;
    },

    create: async (payload: WorkoutPayload) => {
        const { data } = await api.post<Workout>("/workouts", payload);
        return data;
    },

    update: async ({ id, payload }: UpdateWorkoutPayload) => {
        const { data } = await api.put<Workout>(`/workouts/${id}`, payload);
        return data;
    },

    toggleStatus: async (id: number) => {
        const { data } = await api.patch<Workout>(`/workouts/${id}/status`);
        return data;
    },

    delete: async (id: string) => {
        await api.delete(`/workouts/${id}`);
    }
}