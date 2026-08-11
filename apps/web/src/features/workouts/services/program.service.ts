import api from "@/core/api";
import type { ActiveProgramNext, ProgramWithWorkouts } from "@/features/workouts/program.types.ts";

export interface ProgramPayload {
    name: string;
    description?: string;
    /** A ordem do array É a ordem da rotação — o servidor deriva `orderIndex` dela. */
    workoutIds: number[];
}

export interface UpdateProgramPayload {
    id: string;
    payload: ProgramPayload;
}

export const ProgramService = {
    getAll: async () => {
        const { data } = await api.get<ProgramWithWorkouts[]>("/programs");
        return data;
    },

    getById: async (id: string) => {
        const { data } = await api.get<ProgramWithWorkouts>(`/programs/${id}`);
        return data;
    },

    create: async (payload: ProgramPayload) => {
        const { data } = await api.post<ProgramWithWorkouts>("/programs", payload);
        return data;
    },

    update: async ({ id, payload }: UpdateProgramPayload) => {
        const { data } = await api.put<ProgramWithWorkouts>(`/programs/${id}`, payload);
        return data;
    },

    activate: async (id: number) => {
        const { data } = await api.patch<ProgramWithWorkouts>(`/programs/${id}/activate`);
        return data;
    },

    deactivate: async (id: number) => {
        const { data } = await api.patch<ProgramWithWorkouts>(`/programs/${id}/deactivate`);
        return data;
    },

    delete: async (id: number) => {
        await api.delete(`/programs/${id}`);
    },

    /**
     * Não ter programa ativo é estado normal, não erro: o servidor responde 204 e o
     * axios entrega `data` como string vazia. Sem esta normalização, `""` chegaria à
     * UI como um objeto falsy porém definido, e o React Query trataria como sucesso
     * com dado — o card renderizaria vazio em vez de mostrar o convite a criar.
     */
    getActiveNext: async (): Promise<ActiveProgramNext | null> => {
        const response = await api.get<ActiveProgramNext | "">("/programs/active/next");

        if (response.status === 204 || !response.data) return null;

        return response.data;
    },
};
