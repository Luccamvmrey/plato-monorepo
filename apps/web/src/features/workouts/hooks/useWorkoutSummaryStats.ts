import { useMemo } from "react";
import type { MuscleGroup } from "@plato/database/dist/generated/prisma/enums.ts";
import type { Workout, WorkoutSession } from "@/features/workouts/workout.types.ts";
import { calculateSetVolume, calculateTotalVolume } from "@/features/workouts/utils/analytics.ts";

export type SummaryStats = {
    totalVolume: number;
    muscleDistribution: {
        muscle: MuscleGroup;
        percentage: number;
        absoluteVolume: number;
    }[];
    prs: {
        exerciseName: string;
        weight: number;
        improvement: number;
    }[];
};

export const useWorkoutSummaryStats = (
    workoutSession: WorkoutSession | undefined,
    workout: Workout | undefined,
    lastSession: WorkoutSession | null | undefined
): SummaryStats | null => {
    return useMemo(() => {
        if (!workoutSession || !workout) return null;

        const sets = workoutSession.sessionSet || [];
        
        // 1. Volume Total
        const totalVolume = calculateTotalVolume(sets);

        if (totalVolume === 0) {
            return {
                totalVolume: 0,
                muscleDistribution: [],
                prs: []
            };
        }

        // 2. Distribuição por Músculo
        const volumeByMuscle: Partial<Record<MuscleGroup, number>> = {};
        sets.forEach(set => {
            const we = workout.workoutExercise.find(we => we.exerciseId === set.exerciseId);
            const exercise = we?.exercise;
            if (exercise) {
                const muscle = exercise.targetMuscle;
                const setVolume = calculateSetVolume(set.actualWeight, set.actualReps, set.equipmentWeight || 0);
                volumeByMuscle[muscle] = (volumeByMuscle[muscle] || 0) + setVolume;
            }
        });

        const muscleDistribution = Object.entries(volumeByMuscle).map(([muscle, volume]) => ({
            muscle: muscle as MuscleGroup,
            percentage: (volume! / totalVolume) * 100,
            absoluteVolume: volume!
        })).sort((a, b) => b.percentage - a.percentage);

        // 3. Detecção de PRs
        const prs: { exerciseName: string; weight: number; improvement: number }[] = [];
        
        if (lastSession) {
            const currentExMaxWeights: Record<number, number> = {};
            sets.forEach(set => {
                const totalWeight = set.actualWeight + (set.equipmentWeight || 0);
                currentExMaxWeights[set.exerciseId] = Math.max(currentExMaxWeights[set.exerciseId] || 0, totalWeight);
            });

            const lastExMaxWeights: Record<number, number> = {};
            lastSession.sessionSet.forEach(set => {
                const totalWeight = set.actualWeight + (set.equipmentWeight || 0);
                lastExMaxWeights[set.exerciseId] = Math.max(lastExMaxWeights[set.exerciseId] || 0, totalWeight);
            });

            Object.entries(currentExMaxWeights).forEach(([exId, weight]) => {
                const exerciseId = parseInt(exId);
                const lastWeight = lastExMaxWeights[exerciseId];
                if (lastWeight && weight > lastWeight) {
                    const exerciseName = workout.workoutExercise.find(we => we.exerciseId === exerciseId)?.exercise?.name || "Exercício";
                    prs.push({
                        exerciseName,
                        weight,
                        improvement: weight - lastWeight
                    });
                }
            });
        }

        return {
            totalVolume,
            muscleDistribution,
            prs
        };
    }, [workoutSession, workout, lastSession]);
};
