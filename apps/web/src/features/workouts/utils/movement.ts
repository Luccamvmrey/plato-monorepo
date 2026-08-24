import type { Exercise } from "@/features/workouts/workout.types.ts";
import type { WorkoutExerciseDraft } from "@/features/workouts/stores/workout-editor.store.ts";

export const MOVEMENT_PATTERN_LABEL: Record<string, string> = {
    HORIZONTAL_PUSH: "Empurrar horizontal",
    VERTICAL_PUSH:   "Empurrar vertical",
    HORIZONTAL_PULL: "Puxar horizontal",
    VERTICAL_PULL:   "Puxar vertical",
    SQUAT:           "Agachamento",
    HIP_HINGE:       "Dobradiça de quadril",
    LUNGE:           "Avanço/unilateral",
    ISOLATION:       "Isolado",
    CARRY:           "Carregamento",
    CORE:            "Core",
};

export const EQUIPMENT_LABEL: Record<string, string> = {
    BARBELL:    "Barra",
    DUMBBELL:   "Halteres",
    MACHINE:    "Máquina",
    CABLE:      "Polia",
    SMITH:      "Smith",
    BODYWEIGHT: "Peso corporal",
    EZ_BAR:     "Barra EZ",
    KETTLEBELL: "Kettlebell",
};

/**
 * Rótulos de agrupamento. Curtos de propósito: aparecem num chip dentro do card do
 * exercício, numa linha que já divide 390px com nome, séries e repetições.
 */
export const GROUP_TYPE_LABEL: Record<string, string> = {
    SUPERSET:   "Bi-set",
    REST_PAUSE: "Rest-pause",
};

/** O que o tipo significa na execução — vai no `aria-label` e no title do chip. */
export const GROUP_TYPE_DESCRIPTION: Record<string, string> = {
    SUPERSET:   "Uma série de cada, revezando, sem descanso entre eles",
    REST_PAUSE: "Uma série de cada, em cadeia contínua, com pausas curtas",
};

/**
 * Rótulo do campo de carga na sessão ativa, por `LoadType`. `EXTERNAL` fica de fora —
 * mantém "Carga" como já é hoje, sem mudança visual pro caso comum.
 */
export const LOAD_TYPE_LABEL: Record<string, string> = {
    BODYWEIGHT:        "Carga extra",
    BODYWEIGHT_LOADED: "Carga extra",
    ASSISTED:          "Assistência",
};

/** Legenda que explica o que o número significa — evita registrar peso corporal como carga. */
export const LOAD_TYPE_HINT: Record<string, string> = {
    BODYWEIGHT:        "opcional · peso corporal já conta sozinho",
    BODYWEIGHT_LOADED: "além do peso corporal, ex.: cinto",
    ASSISTED:          "quanto menor, mais difícil",
};

export const ALTERNATIVE_REASON_LABEL: Record<string, string> = {
    SAME_PATTERN_SAME_EQUIPMENT:  "Mesmo padrão, mesmo equipamento",
    SAME_PATTERN_OTHER_EQUIPMENT: "Mesmo padrão, outro equipamento",
    SAME_PATTERN_OTHER_MUSCLE:    "Mesmo padrão, outro músculo alvo",
    SAME_MUSCLE_OTHER_PATTERN:    "Mesmo músculo alvo, outro padrão",
};

export const describeExercise = (exercise: Pick<Exercise, "movementPattern" | "equipment">) =>
    [
        exercise.movementPattern ? MOVEMENT_PATTERN_LABEL[exercise.movementPattern] : null,
        exercise.equipment ? EQUIPMENT_LABEL[exercise.equipment] : null,
    ]
        .filter(Boolean)
        .join(" · ");

export interface RedundantGroup {
    key: string;
    label: string;
    drafts: WorkoutExerciseDraft[];
}

/**
 * Exercícios do mesmo treino que repetem o padrão de movimento.
 *
 * Estado derivado, computado no cliente: `GET /exercises` já traz `movementPattern`,
 * e persistir isso no servidor seria guardar o que se pode calcular.
 *
 * A chave de agrupamento muda conforme o padrão. Para composto basta o padrão — duas
 * puxadas horizontais competem entre si independente do alvo declarado. Para
 * `ISOLATION` e `CORE` o padrão sozinho agruparia rosca com elevação lateral e
 * panturrilha, que não têm nada a ver; ali a repetição só existe se o músculo alvo
 * também for o mesmo.
 *
 * Nunca é erro — é informação. Três roscas no mesmo treino pode ser exatamente o que
 * o usuário quis.
 */
export const findRedundantGroups = (drafts: WorkoutExerciseDraft[]): RedundantGroup[] => {
    const byKey = new Map<string, RedundantGroup>();

    for (const draft of drafts) {
        const pattern = draft.exercise.movementPattern;
        if (!pattern) continue;

        const perMuscle = pattern === "ISOLATION" || pattern === "CORE";
        const key = perMuscle ? `${pattern}:${draft.exercise.targetMuscle}` : pattern;
        const label = MOVEMENT_PATTERN_LABEL[pattern] ?? pattern;

        const group = byKey.get(key);

        if (group) {
            group.drafts.push(draft);
        } else {
            byKey.set(key, { key, label, drafts: [draft] });
        }
    }

    return [...byKey.values()].filter((group) => group.drafts.length > 1);
};
