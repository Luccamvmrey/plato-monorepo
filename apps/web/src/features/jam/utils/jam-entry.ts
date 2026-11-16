/**
 * Quem entra no meio começa no exercício do grupo. A resposta do join sabe qual é, mas a
 * sessão só monta na tela seguinte: o exercício fica guardado aqui até a sessão aplicá-lo.
 */
const keyOf = (sessionId: number) => `plato-jam-entry:${sessionId}`;

export const rememberJamEntry = (sessionId: number, exerciseId: number) => {
    try {
        sessionStorage.setItem(keyOf(sessionId), String(exerciseId));
    } catch {
        // Sem storage, a pessoa só começa pelo primeiro exercício.
    }
};

export const consumeJamEntry = (sessionId: number): number | null => {
    try {
        const value = sessionStorage.getItem(keyOf(sessionId));
        sessionStorage.removeItem(keyOf(sessionId));
        return value ? Number(value) : null;
    } catch {
        return null;
    }
};
