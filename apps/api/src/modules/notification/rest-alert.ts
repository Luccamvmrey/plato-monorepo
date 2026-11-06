import { sendPushToUser } from "../../shared/push/push";

/** Depois disso a pessoa já voltou ao treino: melhor perder o aviso do que entregá-lo atrasado. */
const REST_ALERT_TTL_SECONDS = 60;

/**
 * Um descanso por pessoa, em memória. Reiniciar a API perde o aviso em andamento, o que é raro
 * e custa pouco. Por isso não vale guardar no banco algo que dura no máximo alguns minutos.
 */
const pending = new Map<number, NodeJS.Timeout>();

export const cancelRestAlert = (userId: number) => {
    clearTimeout(pending.get(userId));
    pending.delete(userId);
};

export const scheduleRestAlert = (userId: number, endpoint: string, remainingMs: number, measureFrom: number) => {
    cancelRestAlert(userId);

    const timer = setTimeout(() => {
        pending.delete(userId);

        sendPushToUser(
            userId,
            {
                title: "Descanso concluído",
                body: "Próxima série!",
                url: "/active-workout",
                tag: "rest-alert",
                measureFrom,
            },
            { endpoint, ttlSeconds: REST_ALERT_TTL_SECONDS, urgency: "high" }
        ).catch((error) => console.error(`Rest alert failed for user ${userId}`, error));
    }, remainingMs);

    timer.unref();
    pending.set(userId, timer);
};
