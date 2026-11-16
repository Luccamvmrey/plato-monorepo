/** Uma série do rascunho, no mesmo formato que o aparelho envia. */
export interface DraftSet {
    workoutSessionId: number;
    exerciseId: number;
    setNumber: number;
    actualReps: number;
    actualWeight: number | null;
    equipmentWeight?: number;
    rpe: number | null;
    userObservation?: string;
}

const isPositiveInt = (value: unknown): value is number => Number.isInteger(value) && (value as number) > 0;
const isNumberOrNull = (value: unknown): value is number | null => value === null || typeof value === "number";

/**
 * As séries que o servidor guardou como rascunho, para o aparelho que abre uma sessão já em
 * andamento (outro celular, navegador limpo, app reinstalado). Sem isso o aparelho começava
 * vazio e o próximo envio de rascunho apagava as séries do servidor.
 *
 * O JSON vem do banco e pode ser de outra versão do app: o que não tiver a forma esperada, ou
 * for de outra sessão, fica de fora em vez de quebrar a tela.
 */
export const restoreDraftSets = (draft: unknown, sessionId: number): DraftSet[] => {
    if (!Array.isArray(draft)) return [];

    return draft.flatMap((item: unknown): DraftSet[] => {
        if (typeof item !== "object" || item === null) return [];

        const set = item as Record<string, unknown>;

        if (
            set.workoutSessionId !== sessionId ||
            !isPositiveInt(set.exerciseId) ||
            !isPositiveInt(set.setNumber) ||
            typeof set.actualReps !== "number" ||
            !isNumberOrNull(set.actualWeight) ||
            !isNumberOrNull(set.rpe)
        ) {
            return [];
        }

        return [{
            workoutSessionId: sessionId,
            exerciseId: set.exerciseId,
            setNumber: set.setNumber,
            actualReps: set.actualReps,
            actualWeight: set.actualWeight,
            rpe: set.rpe,
            ...(typeof set.equipmentWeight === "number" ? { equipmentWeight: set.equipmentWeight } : {}),
            ...(typeof set.userObservation === "string" ? { userObservation: set.userObservation } : {}),
        }];
    });
};
