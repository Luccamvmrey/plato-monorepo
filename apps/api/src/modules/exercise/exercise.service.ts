import prisma from "@plato/database";
import { MuscleGroup } from "@plato/database";
import { AppError } from "../../shared/error/AppError";

type CreateExerciseData = {
    name: string;
    targetMuscle: MuscleGroup;
    secondaryMuscles?: MuscleGroup[];
};

const getAll = async () => {
    // Depreciados saem da busca e do picker; o histórico registrado sob eles continua
    // intacto e continua sendo lido pelas telas de sessão e analytics.
    return prisma.exercise.findMany({
        where: { deprecated: false },
        orderBy: { name: "asc" }
    });
}

/**
 * Motivo da sugestão, em código. A tradução mora na UI — string de interface no
 * payload da API vira dívida no dia em que existir um segundo cliente.
 */
type AlternativeReason =
    | "SAME_PATTERN_SAME_EQUIPMENT"
    | "SAME_PATTERN_OTHER_EQUIPMENT"
    | "SAME_PATTERN_OTHER_MUSCLE"
    | "SAME_MUSCLE_OTHER_PATTERN";

const REASON_RANK: Record<AlternativeReason, number> = {
    SAME_PATTERN_SAME_EQUIPMENT:  0,
    SAME_PATTERN_OTHER_EQUIPMENT: 1,
    SAME_PATTERN_OTHER_MUSCLE:    2,
    SAME_MUSCLE_OTHER_PATTERN:    3,
};

/**
 * Substitutos equivalentes, ranqueados.
 *
 * A ordem sai do que torna a troca segura para a progressão: mesmo padrão de
 * movimento primeiro, porque é ele que garante que as cargas dos dois exercícios
 * sejam comparáveis. "Mesmo grupo muscular" sozinho é o último critério justamente
 * por ser o que confunde composto com isolado.
 *
 * Desempate por histórico: um substituto que o usuário já fez tem carga de
 * referência própria, então a prescrição não recomeça do zero.
 */
const getAlternatives = async (userId: number, exerciseId: number, limit = 8) => {
    const target = await prisma.exercise.findUnique({ where: { id: exerciseId } });

    if (!target) throw new AppError("Exercise not found", 404);

    const candidates = await prisma.exercise.findMany({
        where: {
            deprecated: false,
            id: { not: exerciseId },
            OR: [
                ...(target.movementPattern ? [{ movementPattern: target.movementPattern }] : []),
                { targetMuscle: target.targetMuscle },
            ],
        },
    });

    if (candidates.length === 0) return { target, alternatives: [] };

    const history = await prisma.sessionSet.groupBy({
        by: ["exerciseId"],
        where: {
            exerciseId: { in: candidates.map((candidate) => candidate.id) },
            workoutSession: { userId },
        },
        _count: { _all: true },
    });

    const setsByExercise = new Map(history.map((row) => [row.exerciseId, row._count._all]));

    // `ISOLATION` e `CORE` são baldes, não direções: "mesmo padrão, outro músculo"
    // dentro deles significaria sugerir tríceps na polia no lugar de um crucifixo.
    // Para monoarticular, equivalência exige o mesmo músculo alvo — sem exceção.
    const patternIsBucket =
        target.movementPattern === "ISOLATION" || target.movementPattern === "CORE";

    const scored = candidates.map((candidate) => {
        const samePattern =
            target.movementPattern !== null && candidate.movementPattern === target.movementPattern;
        const sameMuscle = candidate.targetMuscle === target.targetMuscle;

        let reason: AlternativeReason;

        if (samePattern && sameMuscle) {
            reason = candidate.equipment !== null && candidate.equipment === target.equipment
                ? "SAME_PATTERN_SAME_EQUIPMENT"
                : "SAME_PATTERN_OTHER_EQUIPMENT";
        } else if (samePattern) {
            reason = "SAME_PATTERN_OTHER_MUSCLE";
        } else {
            reason = "SAME_MUSCLE_OTHER_PATTERN";
        }

        return { ...candidate, reason, recordedSets: setsByExercise.get(candidate.id) ?? 0 };
    })
        .filter((candidate) => !(patternIsBucket && candidate.reason === "SAME_PATTERN_OTHER_MUSCLE"));

    scored.sort((a, b) =>
        REASON_RANK[a.reason] - REASON_RANK[b.reason] ||
        b.recordedSets - a.recordedSets ||
        a.name.localeCompare(b.name, "pt-BR")
    );

    return { target, alternatives: scored.slice(0, limit) };
};

const create = async (data: CreateExerciseData) => {
    const exists = await prisma.exercise.findUnique({ where: { name: data.name } });
    if (exists) throw new AppError("Exercise already exists", 409);

    return prisma.exercise.create({ data });
}

const bulkCreate = async (exercises: CreateExerciseData[]) => {
    return prisma.exercise.createMany({
        data: exercises,
        skipDuplicates: true,
    });
}

const update = async (id: number, data: Partial<CreateExerciseData>) => {
    return prisma.exercise.update({ where: { id }, data });
}

const remove = async (id: number) => {
    // O catálogo é global e as relações são onDelete: Cascade, então apagar um
    // exercício com histórico destrói séries e recordes de TODOS os usuários.
    // SessionExercise entra na conta porque um exercício pode estar no snapshot de uma
    // sessão sem ter nenhuma série (prescrito e não executado). A FK dele é Restrict,
    // então sem esta checagem o delete falharia com erro cru do banco em vez de 409.
    const [sessionSets, workoutExercises, sessionExercises] = await Promise.all([
        prisma.sessionSet.count({ where: { exerciseId: id } }),
        prisma.workoutExercise.count({ where: { exerciseId: id } }),
        prisma.sessionExercise.count({ where: { exerciseId: id } }),
    ]);

    if (sessionSets > 0 || workoutExercises > 0 || sessionExercises > 0) {
        throw new AppError(
            "Exercise is in use and cannot be deleted. Deleting it would cascade into training history.",
            409
        );
    }

    return prisma.exercise.delete({ where: { id } });
}

export { getAll, getAlternatives, create, bulkCreate, update, remove };