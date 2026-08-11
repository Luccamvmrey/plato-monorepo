/**
 * Recálculo de PersonalRecord — Fase 5 do plano de modelagem de carga.
 *
 * Por que apagar e refazer em vez de atualizar: `updateRecordIfBetter` só grava
 * quando o valor é MAIOR, ou seja é monotônico. Um recorde inflado por
 * `actualWeight` cru (peso de assistência lido como carga) nunca desceria sozinho.
 *
 * Reprocessa as sessões concluídas em ordem cronológica, resolvendo o peso corporal
 * na data de cada sessão. Séries com carga efetiva indefinida ou marcadas com
 * `excludedFromRecords` ficam de fora.
 *
 * Dry-run por padrão. Para aplicar: `APPLY=1 npx ts-node prisma/recompute-personal-records.ts`
 */
import prisma from "../index";
import { resolveBodyWeightAt, summarizeSessionRecords } from "@plato/shared";

const APPLY = process.env.APPLY === "1";

type Row = { userId: number; exerciseId: number; type: "WEIGHT" | "VOLUME"; value: number; date: Date };

const main = async () => {
    console.log(APPLY ? "=== APLICANDO ===\n" : "=== DRY RUN (nada sera escrito) ===\n");

    const users = await prisma.user.findMany({ select: { id: true, email: true } });
    const computed: Row[] = [];

    for (const user of users) {
        const logs = await prisma.bodyWeightLog.findMany({
            where: { userId: user.id },
            select: { weight: true, measuredAt: true },
            orderBy: { measuredAt: "asc" },
        });

        const sessions = await prisma.workoutSession.findMany({
            where: { userId: user.id, completedAt: { not: null } },
            orderBy: { completedAt: "asc" },
            include: { sessionSet: { include: { exercise: true } } },
        });

        // best[exerciseId][type] = { value, date } — vence o maior; empate fica com o mais antigo.
        const best: Record<number, Partial<Record<"WEIGHT" | "VOLUME", { value: number; date: Date }>>> = {};

        for (const session of sessions) {
            const sessionDate = session.completedAt ?? session.startedAt;
            const bodyWeight = resolveBodyWeightAt(logs, sessionDate);
            const stats = summarizeSessionRecords(session.sessionSet, bodyWeight);

            for (const [idStr, s] of Object.entries(stats)) {
                const exerciseId = Number(idStr);
                best[exerciseId] ??= {};

                if (s.maxLoad !== null && (best[exerciseId].WEIGHT === undefined || s.maxLoad > best[exerciseId].WEIGHT!.value)) {
                    best[exerciseId].WEIGHT = { value: s.maxLoad, date: sessionDate };
                }
                if (s.sessionVolume !== null && (best[exerciseId].VOLUME === undefined || s.sessionVolume > best[exerciseId].VOLUME!.value)) {
                    best[exerciseId].VOLUME = { value: s.sessionVolume, date: sessionDate };
                }
            }
        }

        for (const [idStr, byType] of Object.entries(best)) {
            for (const type of ["WEIGHT", "VOLUME"] as const) {
                const entry = byType[type];
                if (entry) computed.push({ userId: user.id, exerciseId: Number(idStr), type, value: entry.value, date: entry.date });
            }
        }
    }

    const existing = await prisma.personalRecord.findMany({
        select: { userId: true, exerciseId: true, type: true, value: true },
    });

    const key = (r: { userId: number; exerciseId: number; type: string }) => `${r.userId}:${r.exerciseId}:${r.type}`;
    const before = new Map(existing.map(r => [key(r), r.value]));
    const after = new Map(computed.map(r => [key(r), r.value]));

    const names = new Map(
        (await prisma.exercise.findMany({ select: { id: true, name: true } })).map(e => [e.id, e.name])
    );

    let changed = 0, removed = 0, added = 0;
    const round = (n: number) => Math.round(n * 100) / 100;

    console.log(`ANTES: ${existing.length} registros | DEPOIS: ${computed.length}\n`);
    console.log("=== MUDANCAS ===");

    for (const [k, oldValue] of before) {
        const newValue = after.get(k);
        const [, exId, type] = k.split(":");
        const label = `${(names.get(Number(exId)) ?? `#${exId}`).padEnd(46)} ${type.padEnd(6)}`;

        if (newValue === undefined) {
            console.log(`  REMOVIDO  ${label} ${round(oldValue)} -> (sem dado valido)`);
            removed++;
        } else if (round(newValue) !== round(oldValue)) {
            const arrow = newValue > oldValue ? "sobe" : "DESCE";
            console.log(`  ${arrow.padEnd(9)} ${label} ${round(oldValue)} -> ${round(newValue)}`);
            changed++;
        }
    }

    for (const [k, newValue] of after) {
        if (!before.has(k)) {
            const [, exId, type] = k.split(":");
            console.log(`  NOVO      ${(names.get(Number(exId)) ?? `#${exId}`).padEnd(46)} ${type.padEnd(6)} -> ${round(newValue)}`);
            added++;
        }
    }

    console.log(`\nresumo: ${changed} alterados, ${removed} removidos, ${added} novos, ${before.size - changed - removed} inalterados`);

    if (!APPLY) {
        console.log("\n=== DRY RUN — nada foi escrito ===");
        await prisma.$disconnect();
        return;
    }

    await prisma.$transaction([
        prisma.personalRecord.deleteMany({}),
        prisma.personalRecord.createMany({ data: computed }),
    ]);

    console.log(`\n=== APLICADO — ${computed.length} registros reescritos ===`);
    await prisma.$disconnect();
};

main().catch(async (e) => {
    console.error("ERRO:", e);
    await prisma.$disconnect();
    process.exit(1);
});
