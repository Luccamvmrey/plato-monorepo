import * as workoutSessionService from "../modules/workout-session/workout-session.service";
import { sendPushToUser } from "../shared/push/push";

const CYCLE_INTERVAL_MS = 5 * 60_000;

const notifyClosed = async ({ userId, setCount }: { userId: number; setCount: number }) => {
    try {
        await sendPushToUser(userId, {
            title: "Salvamos seu treino",
            body: `Você não concluiu, então fechamos com ${setCount} ${setCount === 1 ? "série registrada" : "séries registradas"}`,
            url: "/history",
        });
    } catch (error) {
        console.error(`Auto close notification failed for user ${userId}`, error);
    }
};

export const runSessionAutoClose = async (now = new Date()) => {
    const closed = await workoutSessionService.closeIdleSessions(now);

    for (const session of closed) {
        await notifyClosed(session);
    }
};

/** Mesma chave do agendador de notificações: o `DATABASE_URL` local aponta para produção. */
export const startSessionAutoClose = () => {
    if (process.env.SCHEDULER_ENABLED !== "true") return;

    let isRunning = false;

    const tick = async () => {
        if (isRunning) return;

        isRunning = true;

        try {
            await runSessionAutoClose();
        } catch (error) {
            console.error("Session auto close failed", error);
        } finally {
            isRunning = false;
        }
    };

    setInterval(tick, CYCLE_INTERVAL_MS).unref();
    console.log("Session auto close started");
};
