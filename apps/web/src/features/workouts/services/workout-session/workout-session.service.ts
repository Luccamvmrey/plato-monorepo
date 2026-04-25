import api from "@/core/api";
import type { WorkoutSession } from "@/features/workouts/workout.types.ts";

export interface WorkoutSessionPayload {
    workoutId: number;
}

export interface CreateWorkoutSessionResponse {
    newSession: WorkoutSession,
    lastSession: WorkoutSession
}

export interface FindActiveSessionResponse {
    activeSession: WorkoutSession;
    lastSession: WorkoutSession | null;
}

export const WorkoutSessionService = {
    getByUserId: async (filters?: { workoutId?: number; startDate?: string; endDate?: string }) => {
        const { data } = await api.get<WorkoutSession[]>(`/sessions`, { params: filters });
        return data;
    },

    getByWorkoutId: async (workoutId: string) => {
        const { data } = await api.get<WorkoutSession[]>(`/sessions/workout/${workoutId}`);
        return data;
    },

    getById: async (id: number) => {
        const { data } = await api.get<WorkoutSession>(`/sessions/${id}`);
        return data;
    },

    findActiveSession: async () => {
        const { data } = await api.get<FindActiveSessionResponse | null>(`/sessions/active`);
        return data;
    },

    create: async (payload: WorkoutSessionPayload) => {
        const { data } = await api.post<CreateWorkoutSessionResponse>(`/sessions`, payload);
        return data;
    },

    finish: async (id: number) => {
        const { data } = await api.post<WorkoutSession>(`/sessions/${id}/finish`);
        return data;
    },

    delete: async (id: number) => {
        await api.delete(`/sessions/${id}`);
    }
}