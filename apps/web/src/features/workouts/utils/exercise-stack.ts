import type {
    EnrichedExerciseRecord,
    ExerciseStatus,
    SessionSet,
    SessionSetPayload,
    Workout,
    WorkoutSession,
} from "@/features/workouts/workout.types.ts";
import { buildGroupMembership, findActiveExerciseIndex } from "@plato/shared";

/** O que a pilha precisa saber sobre uma linha antes de calcular status e ordem. */
type StackSeed = Omit<EnrichedExerciseRecord, "logs" | "status" | "effectiveTargetSets" | "group"> & {
    /** id do SessionExercise que este substituiu — só existe com snapshot. */
    substitutedForId: number | null;
};

export interface BuildExerciseStackInput {
    workout?: Workout;
    session?: WorkoutSession;
    pendingSets?: SessionSetPayload[];
    sessionExerciseOrder?: number[] | null;
    exerciseExtraSets?: Record<number, number>;
}

/**
 * A pilha de exercícios da sessão ativa, com status derivado.
 *
 * Função pura e fora do hook pelo mesmo motivo de `progression.ts`: é a lógica mais
 * delicada da tela de sessão, e precisa ser exercitável sem navegador.
 *
 * A fonte é o snapshot (`SessionExercise`). O plano vivo só entra quando a sessão não
 * tem snapshot — sessão iniciada antes de 11/08/2026 —, e nesse caso nada de trocar,
 * pular ou adicionar fica disponível, porque não há linha no servidor para referenciar.
 */
export const buildExerciseStack = ({
    workout,
    session,
    pendingSets,
    sessionExerciseOrder,
    exerciseExtraSets,
}: BuildExerciseStackInput): EnrichedExerciseRecord[] => {
    if (!session) return [];

    const snapshot = session.sessionExercise ?? [];
    const isLegacy = snapshot.length === 0;

    if (isLegacy && !workout) return [];

    const serverLogs = session.sessionSet || [];
    const extraSets = exerciseExtraSets ?? {};

    // Merge server-confirmed sets with locally pending sets for UI computation.
    // Pending sets use negative fake IDs so they never collide with DB rows.
    const fakePending: SessionSet[] = (pendingSets ?? []).map((p, i) => ({
        ...p,
        id: -(i + 1),
        userObservation: p.userObservation ?? null,
        createdAt: new Date(),
    } as unknown as SessionSet));
    const allLogs = [...serverLogs, ...fakePending];

    const nameBySessionExerciseId = new Map(snapshot.map((entry) => [entry.id, entry.exercise.name]));
    const replacedByName = new Map<number, string>();
    for (const entry of snapshot) {
        if (entry.substitutedForId !== null) {
            replacedByName.set(entry.substitutedForId, entry.exercise.name);
        }
    }

    const seeds: StackSeed[] = isLegacy
        ? [...(workout!.workoutExercise ?? [])]
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((planned) => ({
                key:                `we:${planned.id}`,
                sessionExerciseId:  null,
                exerciseId:         planned.exerciseId,
                exercise:           planned.exercise!,
                orderIndex:         planned.orderIndex,
                targetSets:         planned.targetSets,
                targetReps:         planned.targetReps,
                observation:        planned.observation,
                origin:             null,
                skipped:            false,
                groupKey:           planned.groupKey,
                groupType:          planned.groupType,
                replacedByName:     null,
                substitutedForName: null,
                substitutedForId:   null,
            }))
        : [...snapshot]
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((entry) => ({
                key:                `se:${entry.id}`,
                sessionExerciseId:  entry.id,
                exerciseId:         entry.exerciseId,
                exercise:           entry.exercise,
                orderIndex:         entry.orderIndex,
                targetSets:         entry.targetSets,
                targetReps:         entry.targetReps,
                observation:        entry.observation,
                origin:             entry.origin,
                skipped:            entry.skipped,
                groupKey:           entry.groupKey,
                groupType:          entry.groupType,
                replacedByName:     replacedByName.get(entry.id) ?? null,
                substitutedForName: entry.substitutedForId !== null
                    ? nameBySessionExerciseId.get(entry.substitutedForId) ?? null
                    : null,
                substitutedForId:   entry.substitutedForId,
            }));

    // Reordenação efêmera da sessão (arrastar/trocar de posição), preservada.
    const ordered = sessionExerciseOrder
        ? [...seeds].sort(
            (a, b) =>
                sessionExerciseOrder.indexOf(a.exerciseId) -
                sessionExerciseOrder.indexOf(b.exerciseId)
          )
        : seeds;

    // O servidor grava o substituto no FIM da ordem, porque deslocar os orderIndex
    // seguintes colidiria com o unique. Aqui ele volta para o lugar do substituído,
    // que é onde o usuário espera vê-lo.
    const positioned: StackSeed[] = [];
    for (const seed of ordered) {
        if (seed.substitutedForId !== null) continue;

        positioned.push(seed);

        // A guarda de null não é defensiva, é obrigatória: em sessão legada os dois
        // lados são null, `null === null` casa, e cada linha encontrava a si mesma
        // como própria substituta — a pilha duplicava inteira.
        const replacement = seed.sessionExerciseId !== null
            ? ordered.find((other) => other.substitutedForId === seed.sessionExerciseId)
            : undefined;

        if (replacement) positioned.push(replacement);
    }
    // Substituto cujo original sumiu da ordem não pode desaparecer da tela.
    for (const seed of ordered) {
        if (!positioned.includes(seed)) positioned.push(seed);
    }

    // Recalculado sobre a ordem FINAL: reordenar a sessão ou reposicionar um
    // substituto pode ter separado dois membros que estavam lado a lado no plano.
    const groupMembership = buildGroupMembership(positioned);

    // Uma passada só para medir, antes de decidir de quem é a vez: dentro de um grupo
    // o próximo depende de QUANTAS séries cada membro já tem, então não dá para
    // resolver o status enquanto se percorre a lista.
    const measured = positioned.map((seed) => {
        const effectiveTargetSets = seed.targetSets + (extraSets[seed.exerciseId] ?? 0);
        const logs = allLogs.filter((log) => log.exerciseId === seed.exerciseId);

        return { logs, effectiveTargetSets, isCompleted: logs.length >= effectiveTargetSets };
    });

    const activeIndex = findActiveExerciseIndex(
        positioned.map((seed, index) => ({
            groupKey: seed.groupKey,
            groupType: seed.groupType,
            completedSets: measured[index].logs.length,
            eligible: !seed.skipped
                && seed.replacedByName === null
                && !measured[index].isCompleted,
        }))
    );

    return positioned.map((seed, index): EnrichedExerciseRecord => {
        const { logs, effectiveTargetSets, isCompleted } = measured[index];

        let status: ExerciseStatus;

        if (seed.skipped) {
            status = "SKIPPED";
        } else if (isCompleted) {
            // Concluído vence "trocado": se as séries foram feitas, foram feitas.
            status = "COMPLETED";
        } else if (seed.replacedByName !== null) {
            status = "REPLACED";
        } else if (index === activeIndex) {
            status = "ACTIVE";
        } else {
            status = "PENDING";
        }

        return { ...seed, logs, status, effectiveTargetSets, group: groupMembership[index] };
    });
};
