import prisma from "@plato/database";

export const scanForRecords = async (userId: number, workoutSessionId: number) => {
    // This is intended to be run asynchronously (non-blocking)
    try {
        const session = await prisma.workoutSession.findUnique({
            where: { id: workoutSessionId },
            include: {
                sessionSet: {
                    include: { exercise: true }
                }
            }
        });

        if (!session) return;

        const exerciseStats: Record<number, { maxWeight: number; maxVolume: number }> = {};

        session.sessionSet.forEach(set => {
            const exerciseId = set.exerciseId;
            const volume = set.actualWeight * set.actualReps;

            if (!exerciseStats[exerciseId]) {
                exerciseStats[exerciseId] = { maxWeight: 0, maxVolume: 0 };
            }

            if (set.actualWeight > exerciseStats[exerciseId].maxWeight) {
                exerciseStats[exerciseId].maxWeight = set.actualWeight;
            }

            if (volume > exerciseStats[exerciseId].maxVolume) {
                exerciseStats[exerciseId].maxVolume = volume;
            }
        });

        for (const [exerciseIdStr, stats] of Object.entries(exerciseStats)) {
            const exerciseId = parseInt(exerciseIdStr);

            // Check Weight Record
            await updateRecordIfBetter(userId, exerciseId, 'WEIGHT', stats.maxWeight);

            // Check Volume Record
            await updateRecordIfBetter(userId, exerciseId, 'VOLUME', stats.maxVolume);
        }
    } catch (error) {
        console.error("Error scanning for personal records:", error);
    }
}

const updateRecordIfBetter = async (userId: number, exerciseId: number, type: 'WEIGHT' | 'VOLUME', value: number) => {
    const existingRecord = await prisma.personalRecord.findUnique({
        where: {
            userId_exerciseId_type: {
                userId,
                exerciseId,
                type
            }
        }
    });

    if (!existingRecord || value > existingRecord.value) {
        await prisma.personalRecord.upsert({
            where: {
                userId_exerciseId_type: {
                    userId,
                    exerciseId,
                    type
                }
            },
            update: {
                value,
                date: new Date()
            },
            create: {
                userId,
                exerciseId,
                type,
                value,
                date: new Date()
            }
        });
        
        // Log for visibility in dev
        console.log(`New ${type} PR for Exercise ${exerciseId}: ${value}`);
    }
}
