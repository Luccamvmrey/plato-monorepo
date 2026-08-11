import { useMemo } from "react";
import type { MuscleGroup } from "@plato/database/dist/generated/prisma/enums.ts";
import type { Workout, WorkoutSession } from "@/features/workouts/workout.types.ts";
import { calculateTotalVolume, calculateSessionDuration, externalLoad, setVolume } from "@plato/shared";
import { buildSessionDeviations, type ExerciseDeviation, type UnexecutedExercise } from "@/features/workouts/utils/session-deviation.ts";

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
        deviation?: ExerciseDeviation;
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
    /** Prescrito que não gerou série: pulado, trocado ou simplesmente não feito. */
    unexecuted: UnexecutedExercise[];
};

export const useWorkoutSummaryStats = (
    workoutSession: WorkoutSession | undefined,
    workout: Workout | undefined,
    lastSession: WorkoutSession | null | undefined
): SummaryStats | null => {
    return useMemo(() => {
        if (!workoutSession || !workout) return null;

        const sets = workoutSession.sessionSet || [];

        const duration = calculateSessionDuration(workoutSession);

        const totalSets = sets.length;
        const totalVolume = calculateTotalVolume(sets);

        const rawVolumeByMuscle: Partial<Record<MuscleGroup, number>> = {};
        sets.forEach(set => {
            // O exercício sai da PRÓPRIA série, não de uma busca no plano do treino.
            // Procurar em `workout.workoutExercise` descartava em silêncio o volume de
            // qualquer exercício fora do plano — o adicionado durante a sessão, e
            // também o que foi removido do treino depois que a sessão aconteceu.
            const exercise = set.exercise;
            if (exercise) {
                rawVolumeByMuscle[exercise.targetMuscle] = (rawVolumeByMuscle[exercise.targetMuscle] || 0) + setVolume(set);
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

        const deviations = buildSessionDeviations(workoutSession);

        // Derivado das SÉRIES, não do plano do treino: partindo do plano, um exercício
        // adicionado durante a sessão nunca aparecia no resumo, mesmo com séries
        // registradas — e o mesmo valia para um exercício removido do treino depois.
        // A ordem do plano é preservada onde ela existe; o que está fora dele vai para
        // o fim, que é onde ele de fato entrou na sessão.
        const planOrder = new Map(workout.workoutExercise.map((we, index) => [we.exerciseId, index]));

        const completedExercises = Object.entries(setsByExercise)
            .map(([exId, exSets]) => {
                const exerciseId = parseInt(exId);
                const exercise = exSets.find(set => set.exercise)?.exercise;
                const lastSet = exSets[exSets.length - 1];

                return {
                    id: exerciseId,
                    name: exercise?.name || "Exercício",
                    muscleGroup: exercise!.targetMuscle,
                    sets: exSets.length,
                    reps: lastSet.actualReps,
                    deviation: deviations.byExerciseId.get(exerciseId),
                };
            })
            .sort((a, b) => (planOrder.get(a.id) ?? Infinity) - (planOrder.get(b.id) ?? Infinity));

        const currentMaxByExercise: Record<number, number> = {};
        sets.forEach(set => {
            currentMaxByExercise[set.exerciseId] = Math.max(currentMaxByExercise[set.exerciseId] || 0, externalLoad(set));
        });

        const lastMaxByExercise: Record<number, number> = {};
        if (lastSession) {
            lastSession.sessionSet.forEach(set => {
                lastMaxByExercise[set.exerciseId] = Math.max(lastMaxByExercise[set.exerciseId] || 0, externalLoad(set));
            });
        }

        const newPRs: SummaryStats["newPRs"] = [];
        Object.entries(currentMaxByExercise).forEach(([exId, newMax]) => {
            const exerciseId = parseInt(exId);
            const previousMax = lastMaxByExercise[exerciseId] ?? 0;
            if (newMax > previousMax) {
                // Mesmo motivo do resto: o nome sai da série, senão um PR num
                // exercício fora do plano aparecia como "Exercício".
                const exerciseName =
                    setsByExercise[exerciseId]?.find(set => set.exercise)?.exercise?.name || "Exercício";
                newPRs.push({ exerciseId, exerciseName, previousMax: lastMaxByExercise[exerciseId] ?? null, newMax });
            }
        });

        return {
            totalVolume,
            duration,
            totalSets,
            completedExercises,
            volumeByGroup,
            newPRs,
            unexecuted: deviations.unexecuted,
        };
    }, [workoutSession, workout, lastSession]);
};
