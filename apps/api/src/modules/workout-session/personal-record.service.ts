import prisma from "@plato/database";
import { RecordType } from "@plato/database";
import { summarizeSessionRecords } from "@plato/shared";
import * as bodyWeightService from "../user/body-weight/body-weight.service";

export const scanForRecords = async (userId: number, workoutSessionId: number) => {
    // Roda fora do caminho crítico (fire-and-forget em finishSession).
    try {
        const session = await prisma.workoutSession.findUnique({
            where: { id: workoutSessionId },
            include: { sessionSet: { include: { exercise: true } } }
        });

        if (!session) return;

        // SessionSet não tem timestamp: a data de uma série é a da sessão.
        const sessionDate = session.completedAt ?? session.startedAt;
        const resolveBodyWeight = await bodyWeightService.createResolver(userId);

        const stats = summarizeSessionRecords(session.sessionSet, resolveBodyWeight(sessionDate));

        for (const [exerciseIdStr, exerciseStats] of Object.entries(stats)) {
            const exerciseId = parseInt(exerciseIdStr);

            if (exerciseStats.maxLoad !== null) {
                await updateRecordIfBetter(userId, exerciseId, "WEIGHT", exerciseStats.maxLoad, sessionDate);
            }

            if (exerciseStats.sessionVolume !== null) {
                await updateRecordIfBetter(userId, exerciseId, "VOLUME", exerciseStats.sessionVolume, sessionDate);
            }
        }
    } catch (error) {
        console.error("Error scanning for personal records:", error);
    }
}

const updateRecordIfBetter = async (
    userId: number,
    exerciseId: number,
    type: RecordType,
    value: number,
    date: Date
) => {
    const where = { userId_exerciseId_type: { userId, exerciseId, type } };

    const existingRecord = await prisma.personalRecord.findUnique({ where });

    if (existingRecord && value <= existingRecord.value) return;

    // `date` é a data da SESSÃO, não a hora do scan. Sem isso, um recálculo do
    // histórico datava todos os recordes como "hoje".
    await prisma.personalRecord.upsert({
        where,
        update: { value, date },
        create: { userId, exerciseId, type, value, date }
    });
}
