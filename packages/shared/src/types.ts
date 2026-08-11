/**
 * Formatos estruturais mínimos, de propósito.
 *
 * O mesmo cálculo roda sobre o `SessionSet` do Prisma (backend) e sobre o tipo
 * espelhado em `apps/web/src/features/workouts/workout.types.ts`. Tipar pelo que a
 * função realmente lê — e não pelo modelo inteiro — deixa os dois lados
 * satisfazerem o contrato sem este pacote depender de nenhum dos dois.
 */

/** O que basta para calcular carga e volume de uma série. */
export interface VolumeSet {
    actualWeight: number;
    actualReps: number;
    /** "Peso da Barra" — componente aditivo da carga. Ausente/nulo significa 0. */
    equipmentWeight?: number | null;
}

/** O que basta para medir esforço. */
export interface RpeSet {
    rpe: number;
}

/** O que basta para contar exercícios distintos. */
export interface ExerciseScopedSet {
    exerciseId: number;
}

/** Série completa, como chega das duas pontas. */
export interface TrainingSet extends VolumeSet, RpeSet, ExerciseScopedSet {}

/**
 * O que basta para contar séries planejadas de um exercício.
 *
 * `targetMuscle` é `string`, não o enum `MuscleGroup`: este pacote não depende do
 * Prisma nem do web, e a soma não interpreta o valor — só agrupa por ele.
 */
export interface PlannedExercise {
    targetSets: number;
    targetMuscle: string;
}

/**
 * Treino para fins de volume planejado. `id` só precisa ser estável dentro do
 * conjunto que está sendo somado — o rascunho do editor usa o id do treino em edição,
 * ou um sentinela para treino ainda não salvo.
 */
export interface PlannedWorkout {
    id: number;
    name: string;
    exercises: PlannedExercise[];
}

/**
 * Sessão para fins de resumo. As datas chegam como `Date` no backend (Prisma) e
 * como `string` no frontend (JSON), então os dois são aceitos.
 */
export interface SummarizableSession {
    startedAt?: Date | string | null;
    completedAt?: Date | string | null;
    sessionSet?: TrainingSet[] | null;
}
