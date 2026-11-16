import prisma from "@plato/database";
import { calculateTotalVolume, type JamExerciseModeValue, type JamPresence, type JamState } from "@plato/shared";
import { sessionSetsSchema } from "../workout-session/workout-session.schema";

const firstName = (name: string | null) => name?.trim().split(/\s+/)[0] || "Alguém";

/** O JSON vem do aparelho: qualquer coisa fora do formato vira "sem presença". */
export const parsePresence = (value: unknown): JamPresence | null => {
    if (typeof value !== "object" || value === null) return null;

    const { exerciseId, restEndsAt } = value as Record<string, unknown>;

    return {
        exerciseId: typeof exerciseId === "number" ? exerciseId : null,
        restEndsAt: typeof restEndsAt === "number" ? restEndsAt : null,
    };
};

export const parseModes = (value: unknown): Record<string, JamExerciseModeValue> => {
    if (typeof value !== "object" || value === null) return {};

    return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).filter(
            (entry): entry is [string, JamExerciseModeValue] => entry[1] === "ALTERNATE" || entry[1] === "PARALLEL"
        )
    );
};

/** Rascunho ilegível não derruba a jam: a pessoa só aparece sem séries até o próximo envio. */
type RawSet = {
    exerciseId: number;
    setNumber: number;
    actualReps: number;
    actualWeight: number | null;
    equipmentWeight: number | null;
};

const parseDraftSets = (draft: unknown) => {
    const parsed = sessionSetsSchema.safeParse(draft ?? []);

    return parsed.success ? parsed.data : [];
};

/** O estado que todo participante vê. Null se a jam não existe. */
export const loadJamState = async (jamId: number): Promise<JamState | null> => {
    const jam = await prisma.jam.findUnique({
        where: { id: jamId },
        select: {
            id: true,
            token: true,
            hostUserId: true,
            createdAt: true,
            endedAt: true,
            exerciseModes: true,
            sharedPlan: {
                select: {
                    name: true,
                    workouts: {
                        orderBy: { orderIndex: "asc" },
                        take: 1,
                        select: {
                            exercises: {
                                orderBy: { orderIndex: "asc" },
                                select: {
                                    exerciseId: true,
                                    targetSets: true,
                                    targetReps: true,
                                    exercise: { select: { name: true } },
                                },
                            },
                        },
                    },
                },
            },
            members: {
                orderBy: { joinedAt: "asc" },
                select: { userId: true, joinedAt: true, leftAt: true, presence: true, user: { select: { name: true } } },
            },
            sessions: {
                orderBy: { startedAt: "desc" },
                select: {
                    id: true,
                    userId: true,
                    completedAt: true,
                    draftSets: true,
                    sessionSet: {
                        orderBy: [{ exerciseId: "asc" }, { setNumber: "asc" }],
                        select: { exerciseId: true, setNumber: true, actualReps: true, actualWeight: true, equipmentWeight: true },
                    },
                    sessionExercise: {
                        orderBy: { orderIndex: "asc" },
                        select: { exerciseId: true, targetSets: true, skipped: true, exercise: { select: { name: true } } },
                    },
                },
            },
        },
    });

    if (!jam) return null;

    // O recorde guarda a data da sessão em que foi batido (a conclusão): é assim que se acha
    // quais são desta jam. Um recorde batido de novo depois muda de data e sai da conta.
    const completed = jam.sessions.filter((session) => session.completedAt !== null);
    const records = completed.length === 0 ? [] : await prisma.personalRecord.findMany({
        where: {
            type: "WEIGHT",
            OR: completed.map((session) => ({ userId: session.userId, date: session.completedAt! })),
        },
        select: { userId: true, date: true },
    });
    const recordCountOf = (userId: number, completedAt: Date) =>
        records.filter((record) => record.userId === userId && record.date.getTime() === completedAt.getTime()).length;

    const planExercises = jam.sharedPlan.workouts[0]?.exercises ?? [];

    return {
        id: jam.id,
        token: jam.token,
        hostUserId: jam.hostUserId,
        createdAt: jam.createdAt.toISOString(),
        endedAt: jam.endedAt?.toISOString() ?? null,
        exerciseModes: parseModes(jam.exerciseModes),
        workout: {
            name: jam.sharedPlan.name,
            exercises: planExercises.map((exercise) => ({
                exerciseId: exercise.exerciseId,
                name: exercise.exercise.name,
                targetSets: exercise.targetSets,
                targetReps: exercise.targetReps,
            })),
        },
        members: jam.members.map((member) => {
            // Mais recente primeiro: quem saiu, cancelou e entrou de novo tem mais de uma.
            const session = jam.sessions.find((candidate) => candidate.userId === member.userId);
            const rawSets: RawSet[] = !session
                ? []
                : session.completedAt
                    ? session.sessionSet
                    : parseDraftSets(session.draftSets).map((set) => ({
                        exerciseId: set.exerciseId,
                        setNumber: set.setNumber,
                        actualReps: set.actualReps,
                        actualWeight: set.actualWeight ?? null,
                        equipmentWeight: set.equipmentWeight ?? null,
                    }));
            const sets = rawSets.map(({ exerciseId, setNumber, actualReps, actualWeight }) => ({
                exerciseId,
                setNumber,
                actualReps,
                actualWeight,
            }));

            return {
                userId: member.userId,
                name: firstName(member.user.name),
                joinedAt: member.joinedAt.toISOString(),
                leftAt: member.leftAt?.toISOString() ?? null,
                presence: parsePresence(member.presence),
                session: session
                    ? {
                        id: session.id,
                        completedAt: session.completedAt?.toISOString() ?? null,
                        exercises: session.sessionExercise.map((exercise) => ({
                            exerciseId: exercise.exerciseId,
                            name: exercise.exercise.name,
                            targetSets: exercise.targetSets,
                            skipped: exercise.skipped,
                        })),
                        sets,
                        volume: calculateTotalVolume(rawSets),
                        recordCount: session.completedAt ? recordCountOf(member.userId, session.completedAt) : null,
                    }
                    : null,
            };
        }),
    };
};
