import prisma from "@plato/database";

const getAll = async () => {
    return prisma.user.findMany({
        select: {
            id: true,
            email: true,
            name: true,
        }
    });
}

const getById = async (id: number) => {
    return prisma.user.findUnique({
        where: { id: id },
        select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
        }
    });
}

const update = async (id: number, data: any) => {
    return prisma.user.update({ where: { id: id }, data });
}

const getProfile = async (userId: number) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, createdAt: true }
    });

    const totalSessions = await prisma.workoutSession.count({
        where: { userId, completedAt: { not: null } }
    });

    const sessionSets = await prisma.sessionSet.findMany({
        where: { workoutSession: { userId } },
        select: { actualWeight: true, actualReps: true }
    });

    const lifetimeVolume = sessionSets.reduce((acc, set) => acc + (set.actualWeight * set.actualReps), 0);

    const totalPRs = await prisma.personalRecord.count({
        where: { userId }
    });

    return { ...user, totalSessions, lifetimeVolume, totalPRs };
}

const getStats = async (userId: number) => {
    // 1. Peak Strength (Max Weight per Muscle Group)
    const records = await prisma.personalRecord.findMany({
        where: { userId, type: 'WEIGHT' },
        include: { exercise: true }
    });

    const peakStrength: Record<string, number> = {};
    records.forEach(r => {
        const muscle = r.exercise.targetMuscle;
        if (!peakStrength[muscle] || r.value > peakStrength[muscle]) {
            peakStrength[muscle] = r.value;
        }
    });

    // 2. Volume Leaders (Highest tonnage per exercise, grouped by muscle)
    const allSessionSets = await prisma.sessionSet.findMany({
        where: { workoutSession: { userId } },
        include: { exercise: true }
    });

    const exerciseVolume: Record<number, { name: string, muscle: string, volume: number }> = {};
    allSessionSets.forEach(set => {
        if (!exerciseVolume[set.exerciseId]) {
            exerciseVolume[set.exerciseId] = {
                name: set.exercise.name,
                muscle: set.exercise.targetMuscle,
                volume: 0
            };
        }
        exerciseVolume[set.exerciseId].volume += (set.actualWeight * set.actualReps);
    });

    const volumeLeaders: Record<string, { name: string, volume: number }> = {};
    Object.values(exerciseVolume).forEach(ev => {
        if (!volumeLeaders[ev.muscle] || ev.volume > volumeLeaders[ev.muscle].volume) {
            volumeLeaders[ev.muscle] = { name: ev.name, volume: ev.volume };
        }
    });

    // 3. Training Distribution (% of sets per muscle group)
    const totalSets = allSessionSets.length;
    const muscleFrequency: Record<string, number> = {};
    allSessionSets.forEach(set => {
        const muscle = set.exercise.targetMuscle;
        muscleFrequency[muscle] = (muscleFrequency[muscle] || 0) + 1;
    });

    const distribution = Object.entries(muscleFrequency).map(([muscle, count]) => ({
        muscle,
        percentage: totalSets > 0 ? (count / totalSets) * 100 : 0
    }));

    return { peakStrength, volumeLeaders, distribution };
}

const getExportData = async (userId: number) => {
    return prisma.user.findUnique({
        where: { id: userId },
        include: {
            workouts: {
                include: { workoutExercise: { include: { exercise: true } } }
            },
            workoutSession: {
                include: { sessionSet: { include: { exercise: true } } }
            },
            personalRecord: {
                include: { exercise: true }
            }
        }
    });
}

const deleteAccount = async (userId: number) => {
    return prisma.user.delete({ where: { id: userId } });
}

export { getAll, getById, update, getProfile, getStats, getExportData, deleteAccount }