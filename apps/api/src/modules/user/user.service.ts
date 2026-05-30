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

const getStreak = async (userId: number, timezone: string = 'UTC') => {
    const sessions = await prisma.workoutSession.findMany({
        where: { userId, completedAt: { not: null } },
        select: { completedAt: true },
    });

    const trainedDates = new Set<string>(
        sessions.map(s => _toDateStrTZ(s.completedAt!, timezone))
    );

    const now = new Date();
    const today = _toDateStrTZ(now, timezone);
    const weekMondayStr = _getMondayStrOf(now, timezone);

    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const dateStr = _addDays(weekMondayStr, i);
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
    let weekStartStr = weekMondayStr;

    while (true) {
        const weekSundayStr = _addDays(weekStartStr, 6);
        const upperBoundStr = isFirstWeek ? today : weekSundayStr;

        const days = _getDaysBetweenStr(weekStartStr, upperBoundStr);
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

        weekStartStr = _addDays(weekStartStr, -7);
    }

    return { currentStreak: streak, restDaysUsedThisWeek, weekDays };
};

const _toDateStrTZ = (date: Date, tz: string): string =>
    new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(date);

const _addDays = (dateStr: string, days: number): string => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(Date.UTC(year, month - 1, day + days));
    return d.toISOString().split('T')[0];
};

const _getMondayStrOf = (date: Date, tz: string): string => {
    const localDateStr = _toDateStrTZ(date, tz);
    const [year, month, day] = localDateStr.split('-').map(Number);
    const d = new Date(Date.UTC(year, month - 1, day));
    const dow = d.getUTCDay();
    return _addDays(localDateStr, dow === 0 ? -6 : 1 - dow);
};

const _getDaysBetweenStr = (startStr: string, endStr: string): string[] => {
    const days: string[] = [];
    let cur = startStr;
    while (cur <= endStr) {
        days.push(cur);
        cur = _addDays(cur, 1);
    }
    return days;
};

export { getAll, getById, update, getProfile, getStats, getExportData, deleteAccount, getStreak }