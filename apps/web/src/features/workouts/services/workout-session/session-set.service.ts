import api from "@/core/api";

export interface SessionSet {
    workoutSessionId: number;
    exerciseId: number;
    setNumber: number;
    actualReps: number;
    actualWeight: number;
    equipmentWeight?: number;
    rpe: number;
}

export interface UpdateSessionSetPayload {
    sessionSetId: number;
    payload: Partial<SessionSet>;
}

export const SessionSetService = {
    create: async (payload: SessionSet) => {
        const { data } = await api.post(`/sessions/sets`, payload);
        return data;
    },

    update: async ({ sessionSetId, payload }: UpdateSessionSetPayload) => {
        const { data } = await api.put(`/sessions/sets/${sessionSetId}`, payload);
        return data;
    }
}