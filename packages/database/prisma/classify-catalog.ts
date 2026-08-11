/**
 * Classificação do catálogo — Fase 3 do plano de modelagem de carga.
 *
 * Três grupos de atualização, todos decididos com o usuário em 2026-08-10:
 *   1. loadType/repUnit dos 11 exercícios que não são carga externa
 *   2. deprecated nos 12 genéricos "(Padrão)" SEM histórico (os 10 com histórico
 *      ficam de fora por decisão explícita — o histórico deles importa)
 *   3. Cadeira Adutora sai de GLUTES para ADDUCTORS
 *
 * Roda em dry-run por padrão. Para aplicar: `APPLY=1 npx ts-node prisma/classify-catalog.ts`
 */
import prisma from "../index";
import { LoadType, MuscleGroup, RepUnit } from "../generated/prisma/enums";

const APPLY = process.env.APPLY === "1";

const LOAD_TYPES: { id: number; loadType: LoadType; repUnit: RepUnit }[] = [
    // Peso corporal + lastro opcional
    { id: 13, loadType: "BODYWEIGHT_LOADED", repUnit: "REPS" },  // Paralelas (Dips)
    { id: 24, loadType: "BODYWEIGHT_LOADED", repUnit: "REPS" },  // Barra Fixa Pronada
    { id: 25, loadType: "BODYWEIGHT_LOADED", repUnit: "REPS" },  // Barra Fixa Supinada
    { id: 97, loadType: "BODYWEIGHT_LOADED", repUnit: "REPS" },  // Flexão de Braço
    { id: 117, loadType: "BODYWEIGHT_LOADED", repUnit: "REPS" }, // Abdominal Infra na Paralela

    // Peso corporal puro, contado em repetições
    { id: 67, loadType: "BODYWEIGHT", repUnit: "REPS" },         // Elevação de Pernas Suspenso
    { id: 80, loadType: "BODYWEIGHT", repUnit: "REPS" },         // Ab Wheel
    { id: 82, loadType: "BODYWEIGHT", repUnit: "REPS" },         // Elevação de Pernas Deitado

    // Peso corporal puro, contado em segundos
    { id: 66, loadType: "BODYWEIGHT", repUnit: "SECONDS" },      // Prancha Abdominal Isométrica
    { id: 116, loadType: "BODYWEIGHT", repUnit: "SECONDS" },     // Prancha Lateral

    // Assistido: mais assistência = mais fácil
    { id: 98, loadType: "ASSISTED", repUnit: "REPS" },           // Barra Fixa Assistida (Graviton)
];

/**
 * Os 12 "(Padrão)" sem nenhuma série registrada. Os outros 10 genéricos têm
 * histórico e ficam visíveis por decisão do usuário.
 */
const DEPRECATE_IDS = [7, 14, 17, 21, 27, 33, 44, 47, 49, 52, 62, 64];

const ADDUCTOR_ID = 90; // Cadeira Adutora, hoje classificada como GLUTES

const main = async () => {
    console.log(APPLY ? "=== APLICANDO ===\n" : "=== DRY RUN (nada sera escrito) ===\n");

    console.log("1. loadType / repUnit");
    for (const target of LOAD_TYPES) {
        const ex = await prisma.exercise.findUnique({
            where: { id: target.id },
            select: { name: true, loadType: true, repUnit: true },
        });

        if (!ex) { console.log(`   #${target.id} NAO ENCONTRADO`); continue; }

        const changed = ex.loadType !== target.loadType || ex.repUnit !== target.repUnit;
        console.log(`   #${String(target.id).padEnd(4)} ${ex.name.padEnd(45)} ${ex.loadType}/${ex.repUnit} -> ${target.loadType}/${target.repUnit}${changed ? "" : "  (ja igual)"}`);

        if (APPLY && changed) {
            await prisma.exercise.update({
                where: { id: target.id },
                data: { loadType: target.loadType, repUnit: target.repUnit },
            });
        }
    }

    console.log("\n2. deprecated");
    for (const id of DEPRECATE_IDS) {
        const ex = await prisma.exercise.findUnique({
            where: { id },
            select: { name: true, deprecated: true, _count: { select: { sessionSet: true } } },
        });

        if (!ex) { console.log(`   #${id} NAO ENCONTRADO`); continue; }

        // Trava de segurança: nunca depreciar algo que ganhou histórico desde a análise.
        if (ex._count.sessionSet > 0) {
            console.log(`   #${String(id).padEnd(4)} ${ex.name.padEnd(45)} PULADO — tem ${ex._count.sessionSet} series`);
            continue;
        }

        console.log(`   #${String(id).padEnd(4)} ${ex.name.padEnd(45)} deprecated ${ex.deprecated} -> true`);

        if (APPLY && !ex.deprecated) {
            await prisma.exercise.update({ where: { id }, data: { deprecated: true } });
        }
    }

    console.log("\n3. targetMuscle");
    const adductor = await prisma.exercise.findUnique({
        where: { id: ADDUCTOR_ID },
        select: { name: true, targetMuscle: true },
    });

    if (adductor) {
        console.log(`   #${ADDUCTOR_ID}   ${adductor.name.padEnd(45)} ${adductor.targetMuscle} -> ADDUCTORS`);

        if (APPLY && adductor.targetMuscle !== "ADDUCTORS") {
            await prisma.exercise.update({
                where: { id: ADDUCTOR_ID },
                data: { targetMuscle: "ADDUCTORS" as MuscleGroup },
            });
        }
    }

    console.log(APPLY ? "\n=== APLICADO ===" : "\n=== DRY RUN — nada foi escrito ===");

    await prisma.$disconnect();
};

main().catch(async (e) => {
    console.error("ERRO:", e);
    await prisma.$disconnect();
    process.exit(1);
});
