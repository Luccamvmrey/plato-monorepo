import api from "@/core/api";
import type { JamExerciseModeValue, JamPresence } from "@plato/shared";
import type {
    CreateJamResult,
    JamPreview,
    JamState,
    JamWorkoutCandidate,
    JoinJamResult,
} from "@/features/jam/jam.types.ts";

export const JamService = {
    create: async (workoutId: number) => {
        const { data } = await api.post<CreateJamResult>("/jams", { workoutId });
        return data;
    },

    getPreview: async (token: string) => {
        const { data } = await api.get<JamPreview>(`/jams/preview/${token}`);
        return data;
    },

    getCandidates: async (token: string) => {
        const { data } = await api.get<JamWorkoutCandidate[]>(`/jams/${token}/candidates`);
        return data;
    },

    /** Sem `workoutId`, a pessoa recebe uma cópia do treino do host. */
    join: async (token: string, workoutId?: number) => {
        const { data } = await api.post<JoinJamResult>(`/jams/${token}/join`, workoutId ? { workoutId } : {});
        return data;
    },

    getState: async (jamId: number) => {
        const { data } = await api.get<JamState>(`/jams/${jamId}`);
        return data;
    },

    updatePresence: async (jamId: number, presence: JamPresence) => {
        await api.put(`/jams/${jamId}/presence`, presence);
    },

    setExerciseMode: async ({ jamId, exerciseId, mode }: { jamId: number; exerciseId: number; mode: JamExerciseModeValue }) => {
        await api.put(`/jams/${jamId}/modes/${exerciseId}`, { mode });
    },

    leave: async (jamId: number) => {
        await api.post(`/jams/${jamId}/leave`);
    },
};
