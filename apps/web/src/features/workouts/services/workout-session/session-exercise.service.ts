import api from "@/core/api";
import type { ExerciseHistoryMap, SessionExercise } from "@/features/workouts/workout.types.ts";

export const SessionExerciseService = {
    list: async (sessionId: number) => {
        const { data } = await api.get<SessionExercise[]>(`/sessions/${sessionId}/exercises`);
        return data;
    },

    add: async (sessionId: number, payload: { exerciseId: number; targetSets?: number; targetReps?: number }) => {
        const { data } = await api.post<SessionExercise>(`/sessions/${sessionId}/exercises`, payload);
        return data;
    },

    substitute: async (sessionId: number, sessionExerciseId: number, exerciseId: number) => {
        const { data } = await api.patch<SessionExercise>(
            `/sessions/${sessionId}/exercises/${sessionExerciseId}/substitute`,
            { exerciseId }
        );
        return data;
    },

    setSkipped: async (sessionId: number, sessionExerciseId: number, skipped: boolean) => {
        const { data } = await api.patch<SessionExercise>(
            `/sessions/${sessionId}/exercises/${sessionExerciseId}/skip`,
            { skipped }
        );
        return data;
    },

    remove: async (sessionId: number, sessionExerciseId: number) => {
        await api.delete(`/sessions/${sessionId}/exercises/${sessionExerciseId}`);
    },

    /**
     * Histórico resolvido pela SESSÃO, não pelo treino: é o que devolve histórico
     * global para o exercício que entrou fora do plano, que de outro modo ficaria sem
     * carga de referência.
     */
    getExerciseHistory: async (sessionId: number) => {
        const { data } = await api.get<ExerciseHistoryMap>(`/sessions/${sessionId}/exercise-history`);
        return data;
    },
};
