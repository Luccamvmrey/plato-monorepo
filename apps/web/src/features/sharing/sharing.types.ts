import type {
    ExerciseGroupType,
    MuscleGroup,
    RepUnit,
    SharedPlanKind,
} from "@plato/database/generated/prisma/enums";

export interface PublicSharedExercise {
    orderIndex: number;
    targetSets: number;
    targetReps: number;
    observation: string | null;
    groupKey: string | null;
    groupType: ExerciseGroupType | null;
    exercise: {
        name: string;
        targetMuscle: MuscleGroup;
        repUnit: RepUnit;
    };
}

export interface PublicSharedWorkout {
    orderIndex: number;
    name: string;
    description: string | null;
    exercises: PublicSharedExercise[];
}

export interface PublicSharedPlan {
    token: string;
    kind: SharedPlanKind;
    name: string;
    description: string | null;
    isCurated: boolean;
    focusLabel: string | null;
    sessionsPerWeek: number | null;
    workouts: PublicSharedWorkout[];
}

export interface FeaturedPlan {
    token: string;
    name: string;
    description: string | null;
    focusLabel: string | null;
    sessionsPerWeek: number | null;
    workoutCount: number;
}

export interface OwnSharedLink {
    id: number;
    token: string;
    kind: SharedPlanKind;
    name: string;
    createdAt: string;
    viewCount: number;
    addCount: number;
}

export interface AddSharedPlanResult {
    kind: SharedPlanKind;
    alreadyAdded: boolean;
    activated: boolean;
}

export interface CreateShareLinkPayload {
    kind: SharedPlanKind;
    sourceId: number;
}
