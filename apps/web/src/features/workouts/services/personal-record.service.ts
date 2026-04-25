import api from "@/core/api";

export interface PersonalRecord {
    id: number;
    userId: number;
    exerciseId: number;
    type: 'WEIGHT' | 'VOLUME';
    value: number;
    date: string;
}

export const PersonalRecordService = {
    getByExerciseId: async (exerciseId: number) => {
        const { data } = await api.get<PersonalRecord[]>(`/personal-records/exercise/${exerciseId}`);
        return data;
    },
    
    getAll: async () => {
        const { data } = await api.get<PersonalRecord[]>("/personal-records");
        return data;
    }
}
