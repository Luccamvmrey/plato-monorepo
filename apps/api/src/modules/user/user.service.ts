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

const getStreak = async (userId: number) => {
    const sessions = await prisma.workoutSession.findMany({
        where: { userId, completedAt: { not: null } },
        select: { completedAt: true },
    });

    const trainedDates = new Set<string>(
        sessions.map(s => _toDateStr(s.completedAt!))
    );

    const now = new Date();
    const today = _toDateStr(now);
    const weekMonday = _getMondayOf(now);

    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const day = new Date(weekMonday);
        day.setUTCDate(day.getUTCDate() + i);
        const dateStr = _toDateStr(day);
        const status = trainedDates.has(dateStr)
            ? 'trained'
            : dateStr < today
                ? 'rest_used'
                : 'future';
        return { date: dateStr, dayOfWeek: i, status } as const;
    });

    if (trainedDates.size === 0) {
        return { currentStreak: 0, restDaysUsedThisWeek: 0, weekDays };
    }

    let streak = 0;
    let restDaysUsedThisWeek = 0;
    let isFirstWeek = true;
    const weekStart = new Date(weekMonday);

    while (true) {
        const weekSunday = new Date(weekStart);
        weekSunday.setUTCDate(weekSunday.getUTCDate() + 6);
        const upperBound = isFirstWeek ? now : weekSunday;

        const days = _getDaysBetween(weekStart, upperBound);
        const trained = days.filter(d => trainedDates.has(d));
        let notTrained = days.filter(d => !trainedDates.has(d));

        if (isFirstWeek && !trainedDates.has(today)) {
            notTrained = notTrained.filter(d => d !== today);
        }

        if (notTrained.length > 2) break;
        if (trained.length === 0 && !isFirstWeek) break;

        streak += trained.length;
        if (isFirstWeek) {
            restDaysUsedThisWeek = notTrained.length;
            isFirstWeek = false;
        }

        weekStart.setUTCDate(weekStart.getUTCDate() - 7);
    }

    return { currentStreak: streak, restDaysUsedThisWeek, weekDays };
};

const _toDateStr = (date: Date) => date.toISOString().split('T')[0];

const _getMondayOf = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getUTCDay();
    d.setUTCDate(d.getUTCDate() + (day === 0 ? -6 : 1 - day));
    d.setUTCHours(0, 0, 0, 0);
    return d;
};

const _getDaysBetween = (start: Date, end: Date): string[] => {
    const days: string[] = [];
    const cur = new Date(start);
    cur.setUTCHours(0, 0, 0, 0);
    const endStr = _toDateStr(end);
    while (_toDateStr(cur) <= endStr) {
        days.push(_toDateStr(cur));
        cur.setUTCDate(cur.getUTCDate() + 1);
    }
    return days;
};

export { getAll, getById, update, getProfile, getStats, getExportData, deleteAccount, getStreak }