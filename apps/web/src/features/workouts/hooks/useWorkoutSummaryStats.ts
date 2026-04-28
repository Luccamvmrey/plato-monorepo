import { useMemo } from "react";
import type { MuscleGroup } from "@plato/database/dist/generated/prisma/enums.ts";
import type { Workout, WorkoutSession } from "@/features/workouts/workout.types.ts";
import { calculateSetVolume, calculateTotalVolume } from "@/features/workouts/utils/analytics.ts";

export type SummaryStats = {
    totalVolume: number;
    duration: number;
    totalSets: number;
    completedExercises: {
        id: number;
        name: string;
        muscleGroup: MuscleGroup;
        sets: number;
        reps: number;
    }[];
    volumeByGroup: {
        group: MuscleGroup;
        volume: number;
        percentage: number;
    }[];
    newPRs: {
        exerciseId: number;
        exerciseName: string;
        previousMax: number | null;
        newMax: number;
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

        const duration =
            workoutSession.completedAt && workoutSession.startedAt
                ? Math.round(
                    (new Date(workoutSession.completedAt).getTime() -
                        new Date(workoutSession.startedAt).getTime()) /
                    1000
                )
                : 0;

        const totalSets = sets.length;
        const totalVolume = calculateTotalVolume(sets);

        const rawVolumeByMuscle: Partial<Record<MuscleGroup, number>> = {};
        sets.forEach(set => {
            const we = workout.workoutExercise.find(we => we.exerciseId === set.exerciseId);
            const exercise = we?.exercise;
            if (exercise) {
                const setVolume = calculateSetVolume(set.actualWeight, set.actualReps, set.equipmentWeight || 0);
                rawVolumeByMuscle[exercise.targetMuscle] = (rawVolumeByMuscle[exercise.targetMuscle] || 0) + setVolume;
            }
        });

        const volumeByGroup = Object.entries(rawVolumeByMuscle)
            .map(([group, volume]) => ({
                group: group as MuscleGroup,
                volume: volume!,
                percentage: totalVolume > 0 ? (volume! / totalVolume) * 100 : 0,
            }))
            .sort((a, b) => b.percentage - a.percentage);

        const setsByExercise: Record<number, typeof sets> = {};
        sets.forEach(set => {
            if (!setsByExercise[set.exerciseId]) setsByExercise[set.exerciseId] = [];
            setsByExercise[set.exerciseId].push(set);
        });

        const completedExercises = workout.workoutExercise
            .filter(we => setsByExercise[we.exerciseId])
            .map(we => {
                const exSets = setsByExercise[we.exerciseId];
                const lastSet = exSets[exSets.length - 1];
                return {
                    id: we.exerciseId,
                    name: we.exercise?.name || "Exercício",
                    muscleGroup: we.exercise!.targetMuscle,
                    sets: exSets.length,
                    reps: lastSet.actualReps,
                };
            });

        const newPRs: SummaryStats["newPRs"] = [];

        if (lastSession) {
            const currentMaxByExercise: Record<number, number> = {};
            sets.forEach(set => {
                const total = set.actualWeight + (set.equipmentWeight || 0);
                currentMaxByExercise[set.exerciseId] = Math.max(currentMaxByExercise[set.exerciseId] || 0, total);
            });

            const lastMaxByExercise: Record<number, number> = {};
            lastSession.sessionSet.forEach(set => {
                const total = set.actualWeight + (set.equipmentWeight || 0);
                lastMaxByExercise[set.exerciseId] = Math.max(lastMaxByExercise[set.exerciseId] || 0, total);
            });

            Object.entries(currentMaxByExercise).forEach(([exId, newMax]) => {
                const exerciseId = parseInt(exId);
                const previousMax = lastMaxByExercise[exerciseId];
                if (previousMax !== undefined && newMax > previousMax) {
                    const exerciseName =
                        workout.workoutExercise.find(we => we.exerciseId === exerciseId)?.exercise?.name || "Exercício";
                    newPRs.push({ exerciseId, exerciseName, previousMax, newMax });
                }
            });
        }

        return { totalVolume, duration, totalSets, completedExercises, volumeByGroup, newPRs };
    }, [workoutSession, workout, lastSession]);
};
