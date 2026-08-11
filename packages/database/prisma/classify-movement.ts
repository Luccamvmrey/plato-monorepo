/**
 * Classificação de `movementPattern` e `equipment` dos 105 exercícios ativos.
 *
 * Por que à mão e não por heurística de nome: este catálogo já derrubou heurística
 * antes — "Abdominal na Polia" casa com /abdominal/ e seria marcado peso corporal,
 * mas as cargas registradas sobem em degraus de 6,8 kg (placas de 15 lb), ou seja é
 * stack de máquina. Nome não é evidência suficiente.
 *
 * Convenções desta tabela:
 *   - `equipment: null` nos genéricos "(Padrão)": o padrão de movimento deles é
 *     conhecido, o equipamento não. Inventar um seria mentir com confiança.
 *   - `ISOLATION` é balde para monoarticular. Para isolado, o critério de
 *     equivalência já é o músculo alvo; o que importa é não cruzar com composto.
 *   - Dips e Mergulho no Banco entram como HORIZONTAL_PUSH (padrão de supino
 *     declinado), não VERTICAL_PUSH — vertical é desenvolvimento acima da cabeça.
 *   - Face Pull e Crucifixo Inverso ficam ISOLATION, não HORIZONTAL_PULL: como
 *     puxada horizontal seriam sugeridos no lugar de Remada Curvada, o que é errado.
 *
 * Idempotente: rodar de novo não muda nada. Dry-run por padrão.
 * Para aplicar: `APPLY=1 npx ts-node prisma/classify-movement.ts`
 */
import prisma from "../index";
import { Equipment, MovementPattern } from "../generated/prisma/enums";

const APPLY = process.env.APPLY === "1";

type Row = {
    id: number;
    name: string;
    pattern: MovementPattern;
    equipment: Equipment | null;
    /** Marca as decisões em que o nome não basta e a revisão humana é bem-vinda. */
    review?: string;
};

const CLASSIFICATION: Row[] = [
    // ---------------------------------------------------------------- CHEST
    { id: 1,  name: "Supino Reto (Padrão)",                 pattern: "HORIZONTAL_PUSH", equipment: null },
    { id: 2,  name: "Supino Reto com Barra",                pattern: "HORIZONTAL_PUSH", equipment: "BARBELL" },
    { id: 3,  name: "Supino Reto com Halteres",             pattern: "HORIZONTAL_PUSH", equipment: "DUMBBELL" },
    { id: 4,  name: "Supino Inclinado (Padrão)",            pattern: "HORIZONTAL_PUSH", equipment: null },
    { id: 5,  name: "Supino Inclinado com Barra",           pattern: "HORIZONTAL_PUSH", equipment: "BARBELL" },
    { id: 6,  name: "Supino Inclinado com Halteres",        pattern: "HORIZONTAL_PUSH", equipment: "DUMBBELL" },
    { id: 8,  name: "Supino Declinado com Barra",           pattern: "HORIZONTAL_PUSH", equipment: "BARBELL" },
    { id: 9,  name: "Adução Horizontal Isolada (Padrão)",   pattern: "ISOLATION",       equipment: null },
    { id: 10, name: "Crucifixo Reto com Halteres",          pattern: "ISOLATION",       equipment: "DUMBBELL" },
    { id: 11, name: "Peck Deck (Voador)",                   pattern: "ISOLATION",       equipment: "MACHINE" },
    { id: 12, name: "Crossover na Polia",                   pattern: "ISOLATION",       equipment: "CABLE" },
    { id: 13, name: "Paralelas (Dips)",                     pattern: "HORIZONTAL_PUSH", equipment: "BODYWEIGHT",
      review: "padrão de supino declinado, não desenvolvimento — por isso HORIZONTAL_PUSH" },
    { id: 94, name: "Supino Reto na Máquina",               pattern: "HORIZONTAL_PUSH", equipment: "MACHINE" },
    { id: 95, name: "Crucifixo Inclinado com Halteres",     pattern: "ISOLATION",       equipment: "DUMBBELL" },
    { id: 96, name: "Crossover na Polia Baixa",             pattern: "ISOLATION",       equipment: "CABLE" },
    { id: 97, name: "Flexão de Braço (Push-up)",            pattern: "HORIZONTAL_PUSH", equipment: "BODYWEIGHT" },

    // ------------------------------------------------------------ SHOULDERS
    { id: 15,  name: "Desenvolvimento com Barra",           pattern: "VERTICAL_PUSH", equipment: "BARBELL" },
    { id: 16,  name: "Desenvolvimento com Halteres",        pattern: "VERTICAL_PUSH", equipment: "DUMBBELL" },
    { id: 18,  name: "Elevação Lateral (Padrão)",           pattern: "ISOLATION",     equipment: null },
    { id: 19,  name: "Elevação Lateral com Halteres",       pattern: "ISOLATION",     equipment: "DUMBBELL" },
    { id: 20,  name: "Elevação Lateral na Polia",           pattern: "ISOLATION",     equipment: "CABLE" },
    { id: 22,  name: "Elevação Frontal com Halteres",       pattern: "ISOLATION",     equipment: "DUMBBELL" },
    { id: 34,  name: "Crucifixo Inverso na Máquina",        pattern: "ISOLATION",     equipment: "MACHINE",
      review: "deltoide posterior; como HORIZONTAL_PULL seria sugerido no lugar de remada" },
    { id: 35,  name: "Face Pull na Polia",                  pattern: "ISOLATION",     equipment: "CABLE",
      review: "mesmo motivo do Crucifixo Inverso" },
    { id: 102, name: "Desenvolvimento Arnold",              pattern: "VERTICAL_PUSH", equipment: "DUMBBELL" },
    { id: 103, name: "Desenvolvimento na Máquina",          pattern: "VERTICAL_PUSH", equipment: "MACHINE" },
    { id: 104, name: "Elevação Lateral Inclinado (Unil.)",  pattern: "ISOLATION",     equipment: "DUMBBELL" },

    // -------------------------------------------------------------- TRICEPS
    { id: 59,  name: "Extensão de Cotovelo (Padrão)",       pattern: "ISOLATION",       equipment: null },
    { id: 60,  name: "Tríceps Testa com Barra",             pattern: "ISOLATION",       equipment: "BARBELL" },
    { id: 61,  name: "Tríceps na Polia Alta (Corda)",       pattern: "ISOLATION",       equipment: "CABLE" },
    { id: 72,  name: "Tríceps Francês com Barra EZ",        pattern: "ISOLATION",       equipment: "EZ_BAR" },
    { id: 73,  name: "Tríceps na Polia (Barra Reta)",       pattern: "ISOLATION",       equipment: "CABLE" },
    { id: 74,  name: "Tríceps Coice com Halter",            pattern: "ISOLATION",       equipment: "DUMBBELL" },
    { id: 75,  name: "Mergulho no Banco (Tríceps)",         pattern: "HORIZONTAL_PUSH", equipment: "BODYWEIGHT",
      review: "é pressão, não extensão isolada — pareia com Supino Fechado" },
    { id: 107, name: "Supino Fechado com Barra",            pattern: "HORIZONTAL_PUSH", equipment: "BARBELL" },
    { id: 108, name: "Ext. Tríceps Overhead na Polia",      pattern: "ISOLATION",       equipment: "CABLE" },
    { id: 109, name: "Tríceps Unilateral na Polia",         pattern: "ISOLATION",       equipment: "CABLE" },

    // ----------------------------------------------------------------- BACK
    { id: 23,  name: "Puxada Vertical (Padrão)",            pattern: "VERTICAL_PULL",   equipment: null },
    { id: 24,  name: "Barra Fixa Pronada",                  pattern: "VERTICAL_PULL",   equipment: "BODYWEIGHT" },
    { id: 25,  name: "Barra Fixa Supinada (Chin-up)",       pattern: "VERTICAL_PULL",   equipment: "BODYWEIGHT" },
    { id: 26,  name: "Puxada Frontal na Polia",             pattern: "VERTICAL_PULL",   equipment: "CABLE" },
    { id: 28,  name: "Pulldown com Corda na Polia",         pattern: "VERTICAL_PULL",   equipment: "CABLE",
      review: "se for pulldown de braço estendido, o certo seria ISOLATION" },
    { id: 29,  name: "Remada Horizontal (Padrão)",          pattern: "HORIZONTAL_PULL", equipment: null },
    { id: 30,  name: "Remada Curvada com Barra",            pattern: "HORIZONTAL_PULL", equipment: "BARBELL" },
    { id: 31,  name: "Remada Unilateral com Halter",        pattern: "HORIZONTAL_PULL", equipment: "DUMBBELL" },
    { id: 32,  name: "Remada Baixa na Polia",               pattern: "HORIZONTAL_PULL", equipment: "CABLE" },
    { id: 91,  name: "Remada Curvada no Smith",             pattern: "HORIZONTAL_PULL", equipment: "SMITH" },
    { id: 92,  name: "Remada Cavalinho (T-Bar)",            pattern: "HORIZONTAL_PULL", equipment: "BARBELL" },
    { id: 98,  name: "Barra Fixa Assistida (Graviton)",     pattern: "VERTICAL_PULL",   equipment: "MACHINE" },
    { id: 99,  name: "Puxada Supinada na Polia",            pattern: "VERTICAL_PULL",   equipment: "CABLE" },
    { id: 100, name: "Pullover na Polia Alta",              pattern: "ISOLATION",       equipment: "CABLE",
      review: "monoarticular de ombro; não é puxada" },
    { id: 101, name: "Remada Sentada na Máquina",           pattern: "HORIZONTAL_PULL", equipment: "MACHINE" },

    // --------------------------------------------------------------- BICEPS
    { id: 56,  name: "Flexão de Cotovelo (Padrão)",         pattern: "ISOLATION", equipment: null },
    { id: 57,  name: "Rosca Direta com Barra",              pattern: "ISOLATION", equipment: "BARBELL" },
    { id: 58,  name: "Rosca Martelo com Halteres",          pattern: "ISOLATION", equipment: "DUMBBELL" },
    { id: 68,  name: "Rosca Alternada com Halteres",        pattern: "ISOLATION", equipment: "DUMBBELL" },
    { id: 69,  name: "Rosca Concentrada com Halter",        pattern: "ISOLATION", equipment: "DUMBBELL" },
    { id: 70,  name: "Rosca Scott com Barra EZ",            pattern: "ISOLATION", equipment: "EZ_BAR" },
    { id: 71,  name: "Rosca na Polia Baixa",                pattern: "ISOLATION", equipment: "CABLE" },
    { id: 93,  name: "Rosca Bayesian na Polia",             pattern: "ISOLATION", equipment: "CABLE" },
    { id: 105, name: "Rosca Inclinada com Halteres",        pattern: "ISOLATION", equipment: "DUMBBELL" },
    { id: 106, name: "Rosca Martelo na Corda (Polia)",      pattern: "ISOLATION", equipment: "CABLE" },

    // ------------------------------------------------------------- FOREARMS
    { id: 84, name: "Rosca de Pulso com Barra",             pattern: "ISOLATION", equipment: "BARBELL" },
    { id: 85, name: "Rosca de Pulso Inversa",               pattern: "ISOLATION", equipment: "BARBELL",
      review: "o nome não diz o equipamento; assumi barra por simetria com a #84" },
    { id: 86, name: "Farmer's Walk",                        pattern: "CARRY",     equipment: "DUMBBELL",
      review: "único CARRY do catálogo; pode ser feito com halter, trap bar ou kettlebell" },

    // ---------------------------------------------------------------- TRAPS
    { id: 63, name: "Encolhimento com Halteres",            pattern: "ISOLATION", equipment: "DUMBBELL" },
    { id: 83, name: "Encolhimento com Barra",               pattern: "ISOLATION", equipment: "BARBELL" },

    // ----------------------------------------------------------- QUADRICEPS
    { id: 41,  name: "Agachamento Bilateral (Padrão)",      pattern: "SQUAT",     equipment: null },
    { id: 42,  name: "Agachamento Livre com Barra",         pattern: "SQUAT",     equipment: "BARBELL" },
    { id: 43,  name: "Leg Press 45º",                       pattern: "SQUAT",     equipment: "MACHINE" },
    { id: 45,  name: "Agachamento Búlgaro com Halteres",    pattern: "LUNGE",     equipment: "DUMBBELL",
      review: "unilateral com apoio traseiro: LUNGE, apesar do nome dizer agachamento" },
    { id: 46,  name: "Passada / Afundo com Halteres",       pattern: "LUNGE",     equipment: "DUMBBELL" },
    { id: 48,  name: "Cadeira Extensora",                   pattern: "ISOLATION", equipment: "MACHINE" },
    { id: 89,  name: "Agachamento no Hack",                 pattern: "SQUAT",     equipment: "MACHINE" },
    { id: 110, name: "Leg Press Horizontal",                pattern: "SQUAT",     equipment: "MACHINE" },
    { id: 111, name: "Passada no Smith",                    pattern: "LUNGE",     equipment: "SMITH" },

    // ----------------------------------------------------------- HAMSTRINGS
    { id: 38,  name: "Stiff com Barra",                     pattern: "HIP_HINGE", equipment: "BARBELL" },
    { id: 39,  name: "Levantamento Terra Romeno (RDL)",     pattern: "HIP_HINGE", equipment: "BARBELL" },
    { id: 50,  name: "Cadeira Flexora",                     pattern: "ISOLATION", equipment: "MACHINE" },
    { id: 51,  name: "Mesa Flexora",                        pattern: "ISOLATION", equipment: "MACHINE" },
    { id: 112, name: "Flexora em Pé Unilateral",            pattern: "ISOLATION", equipment: "MACHINE" },
    { id: 113, name: "Nordic Curl",                         pattern: "ISOLATION", equipment: "BODYWEIGHT" },

    // --------------------------------------------------------------- GLUTES
    { id: 36,  name: "Extensão de Quadril (Padrão)",        pattern: "HIP_HINGE", equipment: null },
    { id: 37,  name: "Levantamento Terra Tradicional",      pattern: "HIP_HINGE", equipment: "BARBELL" },
    { id: 40,  name: "Elevação Pélvica com Barra",          pattern: "HIP_HINGE", equipment: "BARBELL" },
    { id: 76,  name: "Abdutor na Máquina",                  pattern: "ISOLATION", equipment: "MACHINE" },
    { id: 77,  name: "Glúteo no Cabo (Kickback)",           pattern: "ISOLATION", equipment: "CABLE" },
    { id: 78,  name: "Agachamento Sumô com Halter",         pattern: "SQUAT",     equipment: "DUMBBELL" },
    { id: 114, name: "Levantamento Terra Sumô",             pattern: "HIP_HINGE", equipment: "BARBELL" },

    // --------------------------------------------------------------- CALVES
    { id: 53,  name: "Elevação de Panturrilha em Pé",       pattern: "ISOLATION", equipment: "MACHINE",
      review: "pode ser no Smith ou com halter dependendo da academia" },
    { id: 54,  name: "Elevação de Panturrilha Sentado",     pattern: "ISOLATION", equipment: "MACHINE" },
    { id: 55,  name: "Panturrilha no Leg Press",            pattern: "ISOLATION", equipment: "MACHINE" },
    { id: 115, name: "Elevação de Panturrilha no Smith",    pattern: "ISOLATION", equipment: "SMITH" },

    // ----------------------------------------------------------------- CORE
    { id: 65,  name: "Abdominal Crunch Tradicional",        pattern: "CORE", equipment: "MACHINE",
      review: "o nome diz 'tradicional' mas as cargas sobem em degraus de 6,8 kg — é stack de máquina" },
    { id: 66,  name: "Prancha Abdominal Isométrica",        pattern: "CORE", equipment: "BODYWEIGHT" },
    { id: 67,  name: "Elevação de Pernas Suspenso",         pattern: "CORE", equipment: "BODYWEIGHT" },
    { id: 79,  name: "Abdominal na Polia (Crunch no Cabo)", pattern: "CORE", equipment: "CABLE" },
    { id: 80,  name: "Ab Wheel (Roda Abdominal)",           pattern: "CORE", equipment: "BODYWEIGHT" },
    { id: 81,  name: "Russian Twist com Peso",              pattern: "CORE", equipment: "DUMBBELL",
      review: "'com peso' não diz qual; halter é o mais comum, mas costuma ser anilha" },
    { id: 82,  name: "Elevação de Pernas Deitado",          pattern: "CORE", equipment: "BODYWEIGHT" },
    { id: 116, name: "Prancha Lateral",                     pattern: "CORE", equipment: "BODYWEIGHT" },
    { id: 117, name: "Abdominal Infra na Paralela",         pattern: "CORE", equipment: "BODYWEIGHT" },

    // ----------------------------------------------------------- LOWER_BACK
    { id: 87, name: "Hiperextensão Lombar",                 pattern: "HIP_HINGE", equipment: "BODYWEIGHT" },
    { id: 88, name: "Good Morning com Barra",               pattern: "HIP_HINGE", equipment: "BARBELL" },

    // ------------------------------------------------------------ ADDUCTORS
    { id: 90, name: "Cadeira Adutora",                      pattern: "ISOLATION", equipment: "MACHINE" },
];

const main = async () => {
    console.log(APPLY ? "=== APLICANDO ===\n" : "=== DRY RUN (nada sera escrito) ===\n");

    const ativos = await prisma.exercise.findMany({
        where: { deprecated: false },
        select: { id: true, name: true, movementPattern: true, equipment: true },
        orderBy: { id: "asc" },
    });

    const classificados = new Set(CLASSIFICATION.map((row) => row.id));
    const faltando = ativos.filter((ex) => !classificados.has(ex.id));
    const inexistentes = CLASSIFICATION.filter((row) => !ativos.some((ex) => ex.id === row.id));

    console.log(`catalogo ativo: ${ativos.length} | classificados aqui: ${CLASSIFICATION.length}`);
    if (faltando.length) console.log(`SEM CLASSIFICACAO: ${faltando.map((e) => `#${e.id} ${e.name}`).join(", ")}`);
    if (inexistentes.length) console.log(`NAO ENCONTRADOS/DEPRECIADOS: ${inexistentes.map((r) => `#${r.id}`).join(", ")}`);

    let alterados = 0;
    let iguais = 0;

    for (const row of CLASSIFICATION) {
        const atual = ativos.find((ex) => ex.id === row.id);
        if (!atual) continue;

        const muda = atual.movementPattern !== row.pattern || atual.equipment !== row.equipment;

        if (muda) {
            alterados++;
            console.log(
                `   #${String(row.id).padEnd(4)} ${row.name.padEnd(38)} ` +
                `${String(atual.movementPattern ?? "-")}/${String(atual.equipment ?? "-")}` +
                ` -> ${row.pattern}/${row.equipment ?? "-"}`
            );
        } else {
            iguais++;
        }

        if (APPLY && muda) {
            await prisma.exercise.update({
                where: { id: row.id },
                data: { movementPattern: row.pattern, equipment: row.equipment },
            });
        }
    }

    console.log(`\nalterados: ${alterados} | ja iguais: ${iguais}`);

    const paraRevisar = CLASSIFICATION.filter((row) => row.review);
    console.log(`\n--- ${paraRevisar.length} decisoes que merecem revisao humana ---`);
    for (const row of paraRevisar) {
        console.log(`   #${String(row.id).padEnd(4)} ${row.name.padEnd(38)} ${row.pattern}/${row.equipment ?? "-"}`);
        console.log(`          ${row.review}`);
    }

    const semEquipamento = CLASSIFICATION.filter((row) => row.equipment === null);
    console.log(`\n${semEquipamento.length} genericos ficam com equipment NULL: ${semEquipamento.map((r) => `#${r.id}`).join(", ")}`);

    if (!APPLY) console.log("\n(dry run - rode com APPLY=1 para gravar)");

    await prisma.$disconnect();
};

main();
