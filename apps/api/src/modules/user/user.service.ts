import prisma from "@plato/database";
import { addDaysToDateStr, calculateTotalVolume, mondayOfDateStr, setVolume, toLocalDateStr } from "@plato/shared";
import { UpdateUserInput } from "../auth/auth.schema";

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

const update = async (id: number, data: UpdateUserInput) => {
    return prisma.user.update({
        where: { id: id },
        data: data.trackingMode ? { ...data, trackingModeChosenAt: new Date() } : data,
        select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
            trackingMode: true,
        }
    });
}

/**
 * Modo de treino e se a pessoa ainda precisa escolher um. Rota própria porque a tela de
 * treinos consulta isto sempre, e o perfil soma todas as séries do histórico.
 */
const getTrackingPreference = async (userId: number) => {
    const user = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { trackingMode: true, trackingModeChosenAt: true },
    });

    if (user.trackingModeChosenAt) return { trackingMode: user.trackingMode, needsChoice: false };

    // Só pergunta a quem nunca treinou: quem já usa o app segue no modo que conhece.
    const sessions = await prisma.workoutSession.count({ where: { userId } });

    return { trackingMode: user.trackingMode, needsChoice: sessions === 0 };
};

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
        // equipmentWeight entra no select porque o volume soma o peso da barra.
        // Sem ele, setVolume leria undefined e a barra sumiria em silêncio.
        select: { actualWeight: true, actualReps: true, equipmentWeight: true }
    });

    const lifetimeVolume = calculateTotalVolume(sessionSets);

    // Cada exercício gera um PR de WEIGHT e outro de VOLUME, então contar linhas
    // dobrava o número. Contamos exercícios distintos em que o usuário tem PR.
    const prExercises = await prisma.personalRecord.findMany({
        where: { userId },
        distinct: ["exerciseId"],
        select: { exerciseId: true }
    });

    const totalPRs = prExercises.length;

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
        exerciseVolume[set.exerciseId].volume += setVolume(set);
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
        // `include` traz todos os escalares do usuário — sem este omit o hash bcrypt
        // ia no corpo do export.
        omit: { password: true, tokenVersion: true },
        include: {
            workouts: {
                include: { workoutExercise: { include: { exercise: true } } }
            },
            workoutSession: {
                include: { sessionSet: { include: { exercise: true } } }
            },
            personalRecord: {
                include: { exercise: true }
            },
            sharedPlan: {
                include: { workouts: { include: { exercises: { include: { exercise: true } } } } }
            },
            // Sem as chaves da inscrição: são segredos do aparelho, não dados sobre a pessoa.
            pushSubscription: { select: { endpoint: true, createdAt: true } },
            notificationPreference: { omit: { unsubscribeToken: true } },
            notificationLog: true,
        }
    });
}

const deleteAccount = async (userId: number) => {
    // Programas primeiro: `ProgramWorkout` é Restrict em `Workout`, então a cascata de
    // `User` travaria nos treinos de quem tem programa e a conta não seria excluída.
    return prisma.$transaction(async (tx) => {
        await tx.program.deleteMany({ where: { userId } });

        return tx.user.delete({ where: { id: userId } });
    });
}

const getStreak = async (userId: number, timezone: string = 'UTC') => {
    const sessions = await prisma.workoutSession.findMany({
        where: { userId, completedAt: { not: null } },
        select: { completedAt: true },
    });

    const trainedDates = new Set<string>(
        sessions.map(s => toLocalDateStr(s.completedAt!, timezone))
    );

    const now = new Date();
    const today = toLocalDateStr(now, timezone);
    const weekMondayStr = mondayOfDateStr(today);

    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const dateStr = addDaysToDateStr(weekMondayStr, i);
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
        const weekSundayStr = addDaysToDateStr(weekStartStr, 6);
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

        weekStartStr = addDaysToDateStr(weekStartStr, -7);
    }

    return { currentStreak: streak, restDaysUsedThisWeek, weekDays };
};

const _getDaysBetweenStr = (startStr: string, endStr: string): string[] => {
    const days: string[] = [];
    let cur = startStr;
    while (cur <= endStr) {
        days.push(cur);
        cur = addDaysToDateStr(cur, 1);
    }
    return days;
};

export { getById, update, getTrackingPreference, getProfile, getStats, getExportData, deleteAccount, getStreak }