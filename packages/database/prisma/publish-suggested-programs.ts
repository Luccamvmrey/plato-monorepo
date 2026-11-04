/**
 * Publica os programas sugeridos de `suggested-programs.ts`.
 *
 * Roda em dry-run por padrão: mostra o conteúdo para revisão e confere os nomes contra o
 * catálogo, sem gravar nada. Para aplicar:
 *   APPLY=1 npx ts-node prisma/publish-suggested-programs.ts
 *
 * Idempotente por `curatedKey`: republicar substitui o conteúdo e mantém o link. Quem já
 * adicionou fica com a própria cópia. Programa retirado da lista sai dos sugeridos, mas o
 * link dele continua abrindo.
 */
import { randomBytes } from "crypto";
import prisma from "../index";
import { SUGGESTED_PROGRAMS, type SuggestedProgram } from "./suggested-programs";

const APPLY = process.env.APPLY === "1";

const databaseHost = () => {
    try {
        return new URL(process.env.DATABASE_URL ?? "").host;
    } catch {
        return "desconhecido";
    }
};

const describe = (program: SuggestedProgram) => {
    const lines = [`\n## ${program.name} (${program.focusLabel}, ${program.sessionsPerWeek}x por semana)`, program.description];

    for (const workout of program.workouts) {
        lines.push(`\n  ${workout.name}`);

        for (const exercise of workout.exercises) {
            lines.push(`    - ${exercise.name}: ${exercise.sets} × ${exercise.reps}`);
            if (exercise.observation) lines.push(`      ${exercise.observation}`);
        }
    }

    return lines.join("\n");
};

const toWorkoutRows = (program: SuggestedProgram, exerciseIdByName: Map<string, number>) =>
    program.workouts.map((workout, workoutIndex) => ({
        orderIndex: workoutIndex + 1,
        name: workout.name,
        description: workout.description ?? null,
        exercises: {
            create: workout.exercises.map((exercise, exerciseIndex) => ({
                exerciseId: exerciseIdByName.get(exercise.name)!,
                orderIndex: exerciseIndex + 1,
                targetSets: exercise.sets,
                targetReps: exercise.reps,
                observation: exercise.observation ?? null,
            })),
        },
    }));

const publish = async (
    program: SuggestedProgram,
    featuredOrder: number,
    exerciseIdByName: Map<string, number>
) => {
    const fields = {
        kind: "PROGRAM" as const,
        name: program.name,
        description: program.description,
        focusLabel: program.focusLabel,
        sessionsPerWeek: program.sessionsPerWeek,
        featuredOrder,
        revokedAt: null,
    };

    await prisma.$transaction(async (tx) => {
        const existing = await tx.sharedPlan.findUnique({ where: { curatedKey: program.key }, select: { id: true } });

        if (existing) {
            await tx.sharedPlanWorkout.deleteMany({ where: { planId: existing.id } });
            await tx.sharedPlan.update({
                where: { id: existing.id },
                data: { ...fields, workouts: { create: toWorkoutRows(program, exerciseIdByName) } },
            });
            return;
        }

        await tx.sharedPlan.create({
            data: {
                ...fields,
                token: randomBytes(16).toString("base64url"),
                curatedKey: program.key,
                workouts: { create: toWorkoutRows(program, exerciseIdByName) },
            },
        });
    });
};

const main = async () => {
    console.log(`Banco: ${databaseHost()} | Modo: ${APPLY ? "APLICAR" : "dry-run, nada será gravado"}`);

    const names = [...new Set(SUGGESTED_PROGRAMS.flatMap((program) =>
        program.workouts.flatMap((workout) => workout.exercises.map((exercise) => exercise.name))
    ))];

    const catalog = await prisma.exercise.findMany({
        where: { name: { in: names } },
        select: { id: true, name: true, deprecated: true },
    });

    const exerciseIdByName = new Map(catalog.map((exercise) => [exercise.name, exercise.id]));
    const missing = names.filter((name) => !exerciseIdByName.has(name));
    const deprecated = catalog.filter((exercise) => exercise.deprecated).map((exercise) => exercise.name);

    SUGGESTED_PROGRAMS.forEach((program) => console.log(describe(program)));

    console.log(`\nExercícios distintos: ${names.length}. Encontrados no catálogo: ${catalog.length}.`);

    if (deprecated.length > 0) console.log(`Marcados como deprecated: ${deprecated.join("; ")}`);

    if (missing.length > 0 || deprecated.length > 0) {
        console.error(`\nFora do catálogo: ${missing.join("; ") || "nenhum"}`);
        throw new Error("Corrija os nomes antes de publicar.");
    }

    if (!APPLY) {
        console.log("\nNada foi gravado. Para publicar: APPLY=1 npx ts-node prisma/publish-suggested-programs.ts");
        return;
    }

    for (const [index, program] of SUGGESTED_PROGRAMS.entries()) {
        await publish(program, index + 1, exerciseIdByName);
    }

    const keys = SUGGESTED_PROGRAMS.map((program) => program.key);
    const { count } = await prisma.sharedPlan.updateMany({
        where: { curatedKey: { not: null, notIn: keys }, featuredOrder: { not: null } },
        data: { featuredOrder: null },
    });

    console.log(`\nPublicados: ${keys.length}. Retirados da lista: ${count}.`);
};

main()
    .catch((error) => {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
