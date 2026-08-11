import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
    estimateSessionsPerWeek,
    findSinglePointMuscles,
    summarizePlannedVolume,
    weeklyExposures,
    type PlannedWorkout,
} from "@plato/shared";
import { WorkoutService } from "@/features/workouts/services/workout.service.ts";
import { WorkoutSessionService } from "@/features/workouts/services/workout-session/workout-session.service.ts";
import { useWorkoutEditorStore } from "@/features/workouts/stores/workout-editor.store.ts";
import type { Workout } from "@/features/workouts/workout.types.ts";

/**
 * Id do rascunho no conjunto somado. Negativo de propósito: os ids reais são
 * autoincrement positivos, então não há como colidir com um treino salvo.
 */
const DRAFT_ID = -1;

export interface PlannedVolumeRow {
    muscle: string;
    /** Séries no ciclo inteiro — este treino mais os outros ativos. */
    cycleSets: number;
    /** Séries que ESTE treino contribui. Muda ao vivo enquanto se edita. */
    draftSets: number;
    /** Treinos do ciclo que atingem o grupo. */
    hitWorkouts: number;
    /** `null` quando não há cadência estimável. Nunca 0 — "não sei" não é "não treina". */
    perWeek: number | null;
    /** O grupo depende só do treino em edição. */
    onlyThisWorkout: boolean;
}

const toPlanned = (workout: Workout): PlannedWorkout => ({
    id: workout.id,
    name: workout.name,
    exercises: workout.workoutExercise
        .filter((we) => we.exercise)
        .map((we) => ({
            targetSets: we.targetSets,
            targetMuscle: we.exercise!.targetMuscle,
        })),
});

/**
 * Volume planejado do ciclo, com a contribuição do treino em edição destacada.
 *
 * As duas queries reusam as chaves que o editor já busca (`["workouts", …]` via
 * `useWorkouts`, `["sessions"]` via `lastCompletedSessionQuery`), então o React Query
 * deduplica e isto não custa requisição nenhuma — só um `select` diferente.
 */
export const usePlannedVolume = (editingId?: string): {
    rows: PlannedVolumeRow[];
    cycleLength: number;
    sessionsPerWeek: number | null;
    singlePointMuscles: string[];
    /**
     * O rascunho ENTRA no ciclo em vez de substituir um treino já ativo — treino
     * novo, ou edição de um inativo. É o que explica o contador ser um a mais que o
     * número de treinos ativos, e por isso o painel precisa dizer isso em texto.
     */
    draftIsAddition: boolean;
} => {
    const draftExercises = useWorkoutEditorStore((state) => state.exercises);
    const draftName = useWorkoutEditorStore((state) => state.name);

    const workoutsQuery = useQuery({
        queryKey: ["workouts", { isActive: undefined }],
        queryFn: () => WorkoutService.getUserWorkouts(),
    });

    const cadenceQuery = useQuery({
        queryKey: ["sessions"],
        queryFn: () => WorkoutSessionService.getByUserId(),
        select: (sessions) =>
            estimateSessionsPerWeek(
                sessions
                    .map((session) => session.completedAt)
                    .filter((date): date is NonNullable<typeof date> => date != null)
            ),
    });

    const sessionsPerWeek = cadenceQuery.data ?? null;

    return useMemo(() => {
        const draft: PlannedWorkout = {
            id: DRAFT_ID,
            name: draftName,
            exercises: draftExercises.map((item) => ({
                targetSets: item.targetSets,
                targetMuscle: item.exercise.targetMuscle,
            })),
        };

        // O treino em edição sai da lista salva e entra como rascunho: senão ele seria
        // contado duas vezes, uma com o dado do servidor e outra com o que está na tela.
        const activeSaved = (workoutsQuery.data ?? []).filter((workout) => workout.isActive);
        const editingActive = activeSaved.some((workout) => String(workout.id) === editingId);

        const others = activeSaved
            .filter((workout) => String(workout.id) !== editingId)
            .map(toPlanned);

        const cycle = [...others, draft];
        const cycleLength = cycle.length;

        const cycleVolume = summarizePlannedVolume(cycle);
        const draftVolume = summarizePlannedVolume([draft]);
        const draftByMuscle = new Map(draftVolume.map((entry) => [entry.muscle, entry.sets]));

        const singlePoint = new Set(
            findSinglePointMuscles(cycleVolume, cycleLength).map((entry) => entry.muscle)
        );

        const rows: PlannedVolumeRow[] = cycleVolume.map((entry) => ({
            muscle: entry.muscle,
            cycleSets: entry.sets,
            draftSets: draftByMuscle.get(entry.muscle) ?? 0,
            hitWorkouts: entry.workoutIds.length,
            perWeek:
                sessionsPerWeek === null
                    ? null
                    : weeklyExposures(entry.workoutIds.length, sessionsPerWeek, cycleLength),
            onlyThisWorkout:
                singlePoint.has(entry.muscle) && entry.workoutIds[0] === DRAFT_ID,
        }));

        return {
            rows,
            cycleLength,
            sessionsPerWeek,
            singlePointMuscles: [...singlePoint],
            draftIsAddition: !editingActive,
        };
    }, [draftExercises, draftName, workoutsQuery.data, editingId, sessionsPerWeek]);
};
