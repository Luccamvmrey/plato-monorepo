/**
 * Marca as séries históricas de Paralelas (#13) como fora de PR e progressão.
 *
 * Motivo: até 06/07/2026 as séries eram no graviton (actualWeight = assistência) e
 * depois passaram a peso corporal com actualWeight = 65 significando o próprio peso.
 * Sob `BODYWEIGHT_LOADED` esse campo passa a ser LASTRO, então 65 viraria 130 kg de
 * carga efetiva. Decisão do usuário em 2026-08-10: não reescrever o histórico e
 * recomeçar limpo — os dados ficam intactos e visíveis, só param de contar.
 *
 * Dry-run por padrão. Para aplicar: `APPLY=1 npx ts-node prisma/exclude-legacy-dips.ts`
 */
import prisma from "../index";

const DIPS_EXERCISE_ID = 13;
const APPLY = process.env.APPLY === "1";

const main = async () => {
    console.log(APPLY ? "=== APLICANDO ===\n" : "=== DRY RUN (nada sera escrito) ===\n");

    const sets = await prisma.sessionSet.findMany({
        where: { exerciseId: DIPS_EXERCISE_ID },
        select: {
            id: true,
            actualWeight: true,
            excludedFromRecords: true,
            workoutSession: { select: { userId: true, completedAt: true } },
        },
    });

    const byUser = new Map<number, number>();
    for (const s of sets) {
        byUser.set(s.workoutSession.userId, (byUser.get(s.workoutSession.userId) ?? 0) + 1);
    }

    const pending = sets.filter(s => !s.excludedFromRecords);

    console.log(`Series de Paralelas: ${sets.length} | ja excluidas: ${sets.length - pending.length} | a marcar: ${pending.length}`);
    console.log("\npor usuario:");
    for (const [userId, count] of [...byUser].sort((a, b) => b[1] - a[1])) {
        console.log(`  user #${userId}: ${count} series`);
    }

    const dated = sets.filter(s => s.workoutSession.completedAt).map(s => s.workoutSession.completedAt!);
    if (dated.length) {
        const min = new Date(Math.min(...dated.map(d => d.getTime())));
        const max = new Date(Math.max(...dated.map(d => d.getTime())));
        console.log(`\nintervalo: ${min.toISOString().slice(0, 10)} -> ${max.toISOString().slice(0, 10)}`);
    }

    if (!APPLY) {
        console.log("\n=== DRY RUN — nada foi escrito ===");
        await prisma.$disconnect();
        return;
    }

    const result = await prisma.sessionSet.updateMany({
        where: { exerciseId: DIPS_EXERCISE_ID },
        data: { excludedFromRecords: true },
    });

    console.log(`\n=== APLICADO — ${result.count} series marcadas ===`);
    await prisma.$disconnect();
};

main().catch(async (e) => {
    console.error("ERRO:", e);
    await prisma.$disconnect();
    process.exit(1);
});
