import api from "@/core/api";
import type { SessionSetPayload, FinishSessionPayload } from "@/features/workouts/workout.types";

export interface UpdateSessionSetPayload {
    sessionSetId: number;
    payload: Partial<SessionSetPayload>;
}

export const SessionSetService = {
    finishSession: async (sessionId: number, payload: FinishSessionPayload): Promise<void> => {
        await api.post(`/sessions/${sessionId}/finish`, payload);
    },

    update: async ({ sessionSetId, payload }: UpdateSessionSetPayload) => {
        const { data } = await api.put(`/sessions/sets/${sessionSetId}`, payload);
        return data;
    }
}
