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
    const [sessionSets, workoutExercises] = await Promise.all([
        prisma.sessionSet.count({ where: { exerciseId: id } }),
        prisma.workoutExercise.count({ where: { exerciseId: id } }),
    ]);

    if (sessionSets > 0 || workoutExercises > 0) {
        throw new AppError(
            "Exercise is in use and cannot be deleted. Deleting it would cascade into training history.",
            409
        );
    }

    return prisma.exercise.delete({ where: { id } });
}

export { getAll, create, bulkCreate, update, remove };