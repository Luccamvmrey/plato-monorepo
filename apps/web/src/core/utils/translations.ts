import type { MuscleGroup } from "@plato/database/generated/prisma/enums";

export const muscleGroupTranslation: Record<MuscleGroup, string> = {
    CHEST: "Peito",
    SHOULDERS: "Ombros",
    TRICEPS: "Tríceps",
    BACK: "Costas",
    BICEPS: "Bíceps",
    FOREARMS: "Antebraços",
    TRAPS: "Trapézio",
    QUADRICEPS: "Quadríceps",
    HAMSTRINGS: "Posterior de Coxa",
    GLUTES: "Glúteos",
    ADDUCTORS: "Adutores",
    CALVES: "Panturrilhas",
    CORE: "Abdômen",
    LOWER_BACK: "Lombar",
    NECK: "Pescoço"
}