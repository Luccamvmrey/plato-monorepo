import type { PlannedExercise, PlannedWorkout } from "./types";

/**
 * Volume PLANEJADO, não executado.
 *
 * `volume.ts` responde "quanta tonelagem eu levantei" — é retrospectivo e sai de
 * `SessionSet`. Aqui a pergunta é outra: "o plano que estou montando distribui
 * trabalho de forma equilibrada?". Sai de `targetSets` e é prospectivo, então a
 * unidade é **série**, nunca quilo. Misturar as duas foi o que produziu, no perfil,
 * uma distribuição por tonelagem que diz mais sobre agachar pesado do que sobre
 * frequência de estímulo.
 */
export interface MuscleVolume {
    muscle: string;
    /** Séries somadas em todos os treinos do conjunto. */
    sets: number;
    /**
     * Treinos que atingem o grupo ao menos uma vez, na ordem de entrada.
     *
     * Presença é ter exercício do grupo, independente de `targetSets`. Contar só
     * quem tem série > 0 faria o grupo sumir do painel enquanto o usuário apaga o
     * campo para redigitar.
     */
    workoutIds: number[];
}

/** Soma não-finita não existe: input de número vazio chega como NaN. */
const finiteSets = (value: number): number => (Number.isFinite(value) ? value : 0);

/**
 * Séries por grupo muscular no conjunto de treinos dado — um ciclo de programa, os
 * treinos ativos do usuário, ou um treino só.
 *
 * Só `targetMuscle`. Contar `secondaryMuscles` como exposição infla o número (todo
 * supino vira exposição de tríceps e ombro) e transforma uma leitura objetiva numa
 * discussão sobre quanto um secundário "conta" — que não tem resposta consensual.
 *
 * Ordenado por séries desc, e por nome do grupo no empate para a lista não dançar
 * entre renders quando dois grupos têm o mesmo total.
 */
export const summarizePlannedVolume = (
    workouts: readonly PlannedWorkout[]
): MuscleVolume[] => {
    const byMuscle = new Map<string, MuscleVolume>();

    for (const workout of workouts) {
        for (const exercise of workout.exercises) {
            const entry = byMuscle.get(exercise.targetMuscle) ?? {
                muscle: exercise.targetMuscle,
                sets: 0,
                workoutIds: [],
            };

            entry.sets += finiteSets(exercise.targetSets);

            if (!entry.workoutIds.includes(workout.id)) {
                entry.workoutIds.push(workout.id);
            }

            byMuscle.set(exercise.targetMuscle, entry);
        }
    }

    return [...byMuscle.values()].sort(
        (a, b) => b.sets - a.sets || a.muscle.localeCompare(b.muscle)
    );
};

/**
 * Grupos servidos por um único treino do ciclo — ponto único de falha.
 *
 * Este é o aviso que importa, e não "o volume planejado está baixo". Medido no banco
 * em 2026-08-11: no bloco de 13/07 a 06/08 o usuário bateu o planejado em 7 dos 8
 * grupos. O único que desabou foi GLÚTEO, e não porque o plano previsse pouco — o
 * plano previa 9 séries — mas porque o único treino que o atingia foi feito uma vez
 * em três semanas e meia. Grupo com uma só porta de entrada cai inteiro quando aquele
 * treino é pulado.
 *
 * Exige `totalWorkouts > 1`: num conjunto de um treino só, todo grupo é servido por
 * um treino, e o aviso não diria nada.
 */
export const findSinglePointMuscles = (
    volume: readonly MuscleVolume[],
    totalWorkouts: number
): MuscleVolume[] =>
    totalWorkouts > 1 ? volume.filter((entry) => entry.workoutIds.length === 1) : [];

/**
 * Exposições semanais de um grupo: quantas vezes por semana ele recebe estímulo, se
 * a rotação for cumprida.
 *
 * `treinos que atingem × (sessões por semana ÷ tamanho do ciclo)`. Com 5 treinos a
 * 3,5 sessões/semana, cada treino sai 0,7 vez por semana; um grupo em 3 dos 5 sai
 * 2,1. É estimativa de plano, não medição — o real depende de cumprir a rotação.
 */
export const weeklyExposures = (
    hitWorkouts: number,
    sessionsPerWeek: number,
    cycleLength: number
): number => (cycleLength > 0 ? (hitWorkouts * sessionsPerWeek) / cycleLength : 0);

const MS_PER_WEEK = 604_800_000;

/** Abaixo disso o intervalo entre duas sessões manda mais que a cadência real. */
const MIN_SESSIONS_FOR_CADENCE = 4;

/**
 * Cadência recente, em sessões por semana, a partir das datas de sessões concluídas.
 *
 * Divide pelo intervalo REALMENTE coberto (primeira à última sessão da janela), não
 * pela largura da janela. Quem voltou a treinar há duas semanas depois de um hiato
 * tem cadência de duas semanas, não de oito — dividir por oito diria que ele treina
 * um terço do que treina.
 *
 * Devolve `null` quando não há sinal suficiente, e quem chama decide o que mostrar.
 * Nunca 0: "não sei" e "não treina" são coisas diferentes.
 */
export const estimateSessionsPerWeek = (
    completedAt: readonly (Date | string)[],
    windowWeeks = 8
): number | null => {
    const cutoff = Date.now() - windowWeeks * MS_PER_WEEK;

    const times = completedAt
        .map((date) => new Date(date).getTime())
        .filter((time) => Number.isFinite(time) && time >= cutoff)
        .sort((a, b) => a - b);

    if (times.length < MIN_SESSIONS_FOR_CADENCE) return null;

    const spanWeeks = Math.max((times[times.length - 1] - times[0]) / MS_PER_WEEK, 1);

    return times.length / spanWeeks;
};

export type { PlannedExercise, PlannedWorkout };
