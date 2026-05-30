import { prisma } from "../index";

async function main() {
    // Find all groups with duplicates
    const duplicates = await prisma.$queryRaw<
        { workoutSessionId: number; exerciseId: number; setNumber: number; count: bigint }[]
    >`
        SELECT "workoutSessionId", "exerciseId", "setNumber", COUNT(*) as count
        FROM "SessionSet"
        GROUP BY "workoutSessionId", "exerciseId", "setNumber"
        HAVING COUNT(*) > 1
    `;

    if (duplicates.length === 0) {
        console.log("Nenhum set duplicado encontrado.");
        return;
    }

    console.log(`Encontrados ${duplicates.length} grupo(s) com duplicatas:`);
    duplicates.forEach(d => {
        console.log(`  sessionId=${d.workoutSessionId} exerciseId=${d.exerciseId} setNumber=${d.setNumber} → ${d.count}x`);
    });

    // Delete duplicates, keeping only the row with the lowest id per group
    const result = await prisma.$executeRaw`
        DELETE FROM "SessionSet"
        WHERE id NOT IN (
            SELECT MIN(id)
            FROM "SessionSet"
            GROUP BY "workoutSessionId", "exerciseId", "setNumber"
        )
    `;

    console.log(`\n${result} set(s) duplicado(s) removido(s).`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
