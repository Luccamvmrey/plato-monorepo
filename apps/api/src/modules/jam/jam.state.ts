import prisma from "@plato/database";
import type { JamExerciseModeValue, JamPresence, JamState } from "@plato/shared";
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
                        select: { exerciseId: true, setNumber: true, actualReps: true, actualWeight: true },
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
            const sets = !session
                ? []
                : session.completedAt
                    ? session.sessionSet
                    : parseDraftSets(session.draftSets).map(({ exerciseId, setNumber, actualReps, actualWeight }) => ({
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
                    }
                    : null,
            };
        }),
    };
};
