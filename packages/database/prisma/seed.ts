import { prisma } from "../index"
import { MuscleGroup } from "../generated/prisma/enums";

const exercises = [
    // --- 1. Empurrar Horizontal ---
    {
        name: "Supino Reto (Padrão)",
        targetMuscle: MuscleGroup.CHEST,
        secondaryMuscles: [MuscleGroup.TRICEPS, MuscleGroup.SHOULDERS]
    },
    {
        name: "Supino Reto com Barra",
        targetMuscle: MuscleGroup.CHEST,
        secondaryMuscles: [MuscleGroup.TRICEPS, MuscleGroup.SHOULDERS]
    },
    {
        name: "Supino Reto com Halteres",
        targetMuscle: MuscleGroup.CHEST,
        secondaryMuscles: [MuscleGroup.TRICEPS, MuscleGroup.SHOULDERS]
    },
    {
        name: "Supino Inclinado (Padrão)",
        targetMuscle: MuscleGroup.CHEST,
        secondaryMuscles: [MuscleGroup.SHOULDERS, MuscleGroup.TRICEPS]
    },
    {
        name: "Supino Inclinado com Barra",
        targetMuscle: MuscleGroup.CHEST,
        secondaryMuscles: [MuscleGroup.SHOULDERS, MuscleGroup.TRICEPS]
    },
    {
        name: "Supino Inclinado com Halteres",
        targetMuscle: MuscleGroup.CHEST,
        secondaryMuscles: [MuscleGroup.SHOULDERS, MuscleGroup.TRICEPS]
    },
    {
        name: "Supino Declinado (Padrão)",
        targetMuscle: MuscleGroup.CHEST,
        secondaryMuscles: [MuscleGroup.TRICEPS]
    },
    {
        name: "Supino Declinado com Barra",
        targetMuscle: MuscleGroup.CHEST,
        secondaryMuscles: [MuscleGroup.TRICEPS]
    },
    {
        name: "Adução Horizontal Isolada (Padrão)",
        targetMuscle: MuscleGroup.CHEST,
        secondaryMuscles: [MuscleGroup.SHOULDERS]
    },
    {
        name: "Crucifixo Reto com Halteres",
        targetMuscle: MuscleGroup.CHEST,
        secondaryMuscles: [MuscleGroup.SHOULDERS]
    },
    {
        name: "Peck Deck (Voador)",
        targetMuscle: MuscleGroup.CHEST,
        secondaryMuscles: [MuscleGroup.SHOULDERS]
    },
    {
        name: "Crossover na Polia",
        targetMuscle: MuscleGroup.CHEST,
        secondaryMuscles: [MuscleGroup.SHOULDERS]
    },
    {
        name: "Paralelas (Dips)",
        targetMuscle: MuscleGroup.CHEST,
        secondaryMuscles: [MuscleGroup.TRICEPS, MuscleGroup.SHOULDERS]
    },

    // --- 2. Empurrar Vertical e Abduções de Ombro ---
    {
        name: "Desenvolvimento Vertical (Padrão)",
        targetMuscle: MuscleGroup.SHOULDERS,
        secondaryMuscles: [MuscleGroup.TRICEPS, MuscleGroup.TRAPS]
    },
    {
        name: "Desenvolvimento com Barra",
        targetMuscle: MuscleGroup.SHOULDERS,
        secondaryMuscles: [MuscleGroup.TRICEPS, MuscleGroup.TRAPS]
    },
    {
        name: "Desenvolvimento com Halteres",
        targetMuscle: MuscleGroup.SHOULDERS,
        secondaryMuscles: [MuscleGroup.TRICEPS, MuscleGroup.TRAPS]
    },
    {
        name: "Abdução de Ombro (Padrão)",
        targetMuscle: MuscleGroup.SHOULDERS,
        secondaryMuscles: [MuscleGroup.TRAPS]
    },
    {
        name: "Elevação Lateral (Padrão)",
        targetMuscle: MuscleGroup.SHOULDERS,
        secondaryMuscles: [MuscleGroup.TRAPS]
    },
    {
        name: "Elevação Lateral com Halteres",
        targetMuscle: MuscleGroup.SHOULDERS,
        secondaryMuscles: [MuscleGroup.TRAPS]
    },
    {
        name: "Elevação Lateral na Polia",
        targetMuscle: MuscleGroup.SHOULDERS,
        secondaryMuscles: [MuscleGroup.TRAPS]
    },
    {
        name: "Flexão de Ombro Frontal (Padrão)",
        targetMuscle: MuscleGroup.SHOULDERS,
        secondaryMuscles: [MuscleGroup.CHEST]
    },
    {
        name: "Elevação Frontal com Halteres",
        targetMuscle: MuscleGroup.SHOULDERS,
        secondaryMuscles: [MuscleGroup.CHEST]
    },

    // --- 3. Puxar Vertical ---
    {
        name: "Puxada Vertical (Padrão)",
        targetMuscle: MuscleGroup.BACK,
        secondaryMuscles: [MuscleGroup.BICEPS, MuscleGroup.FOREARMS]
    },
    {
        name: "Barra Fixa Pronada",
        targetMuscle: MuscleGroup.BACK,
        secondaryMuscles: [MuscleGroup.BICEPS, MuscleGroup.FOREARMS, MuscleGroup.CORE]
    },
    {
        name: "Barra Fixa Supinada (Chin-up)",
        targetMuscle: MuscleGroup.BACK,
        secondaryMuscles: [MuscleGroup.BICEPS, MuscleGroup.FOREARMS]
    },
    {
        name: "Puxada Frontal na Polia",
        targetMuscle: MuscleGroup.BACK,
        secondaryMuscles: [MuscleGroup.BICEPS, MuscleGroup.FOREARMS]
    },
    {
        name: "Extensão de Ombro Isolada (Padrão)",
        targetMuscle: MuscleGroup.BACK,
        secondaryMuscles: [MuscleGroup.TRICEPS, MuscleGroup.CORE]
    },
    {
        name: "Pulldown com Corda na Polia",
        targetMuscle: MuscleGroup.BACK,
        secondaryMuscles: [MuscleGroup.TRICEPS, MuscleGroup.CORE]
    },

    // --- 4. Puxar Horizontal e Posterior de Ombro ---
    {
        name: "Remada Horizontal (Padrão)",
        targetMuscle: MuscleGroup.BACK,
        secondaryMuscles: [MuscleGroup.BICEPS, MuscleGroup.TRAPS, MuscleGroup.LOWER_BACK]
    },
    {
        name: "Remada Curvada com Barra",
        targetMuscle: MuscleGroup.BACK,
        secondaryMuscles: [MuscleGroup.BICEPS, MuscleGroup.TRAPS, MuscleGroup.LOWER_BACK, MuscleGroup.CORE]
    },
    {
        name: "Remada Unilateral com Halter",
        targetMuscle: MuscleGroup.BACK,
        secondaryMuscles: [MuscleGroup.BICEPS, MuscleGroup.TRAPS, MuscleGroup.CORE]
    },
    {
        name: "Remada Baixa na Polia",
        targetMuscle: MuscleGroup.BACK,
        secondaryMuscles: [MuscleGroup.BICEPS, MuscleGroup.TRAPS, MuscleGroup.LOWER_BACK]
    },
    {
        name: "Abdução Horizontal de Ombro (Padrão)",
        targetMuscle: MuscleGroup.SHOULDERS, // Foco no deltoide posterior
        secondaryMuscles: [MuscleGroup.BACK, MuscleGroup.TRAPS]
    },
    {
        name: "Crucifixo Inverso na Máquina (Peck Deck Inverso)",
        targetMuscle: MuscleGroup.SHOULDERS,
        secondaryMuscles: [MuscleGroup.BACK, MuscleGroup.TRAPS]
    },
    {
        name: "Face Pull na Polia",
        targetMuscle: MuscleGroup.SHOULDERS,
        secondaryMuscles: [MuscleGroup.TRAPS, MuscleGroup.BACK]
    },

    // --- 5. Dominância e Extensão de Quadril ---
    {
        name: "Extensão de Quadril (Padrão)",
        targetMuscle: MuscleGroup.GLUTES,
        secondaryMuscles: [MuscleGroup.HAMSTRINGS, MuscleGroup.LOWER_BACK]
    },
    {
        name: "Levantamento Terra Tradicional",
        targetMuscle: MuscleGroup.GLUTES,
        secondaryMuscles: [MuscleGroup.HAMSTRINGS, MuscleGroup.LOWER_BACK, MuscleGroup.QUADRICEPS, MuscleGroup.FOREARMS, MuscleGroup.CORE]
    },
    {
        name: "Stiff com Barra",
        targetMuscle: MuscleGroup.HAMSTRINGS,
        secondaryMuscles: [MuscleGroup.GLUTES, MuscleGroup.LOWER_BACK]
    },
    {
        name: "Levantamento Terra Romeno (RDL)",
        targetMuscle: MuscleGroup.HAMSTRINGS,
        secondaryMuscles: [MuscleGroup.GLUTES, MuscleGroup.LOWER_BACK, MuscleGroup.CORE]
    },
    {
        name: "Elevação Pélvica com Barra",
        targetMuscle: MuscleGroup.GLUTES,
        secondaryMuscles: [MuscleGroup.HAMSTRINGS, MuscleGroup.CORE]
    },

    // --- 6. Dominância e Flexão de Joelho ---
    {
        name: "Agachamento Bilateral (Padrão)",
        targetMuscle: MuscleGroup.QUADRICEPS,
        secondaryMuscles: [MuscleGroup.GLUTES, MuscleGroup.HAMSTRINGS, MuscleGroup.CORE]
    },
    {
        name: "Agachamento Livre com Barra",
        targetMuscle: MuscleGroup.QUADRICEPS,
        secondaryMuscles: [MuscleGroup.GLUTES, MuscleGroup.HAMSTRINGS, MuscleGroup.CORE, MuscleGroup.LOWER_BACK]
    },
    {
        name: "Leg Press 45º",
        targetMuscle: MuscleGroup.QUADRICEPS,
        secondaryMuscles: [MuscleGroup.GLUTES, MuscleGroup.HAMSTRINGS]
    },
    {
        name: "Agachamento Unilateral (Padrão)",
        targetMuscle: MuscleGroup.QUADRICEPS,
        secondaryMuscles: [MuscleGroup.GLUTES, MuscleGroup.HAMSTRINGS, MuscleGroup.CORE]
    },
    {
        name: "Agachamento Búlgaro com Halteres",
        targetMuscle: MuscleGroup.QUADRICEPS,
        secondaryMuscles: [MuscleGroup.GLUTES, MuscleGroup.HAMSTRINGS, MuscleGroup.CORE]
    },
    {
        name: "Passada / Afundo com Halteres",
        targetMuscle: MuscleGroup.QUADRICEPS,
        secondaryMuscles: [MuscleGroup.GLUTES, MuscleGroup.HAMSTRINGS, MuscleGroup.CORE]
    },
    {
        name: "Extensão de Joelho Isolada (Padrão)",
        targetMuscle: MuscleGroup.QUADRICEPS,
        secondaryMuscles: []
    },
    {
        name: "Cadeira Extensora",
        targetMuscle: MuscleGroup.QUADRICEPS,
        secondaryMuscles: []
    },
    {
        name: "Flexão de Joelho Isolada (Padrão)",
        targetMuscle: MuscleGroup.HAMSTRINGS,
        secondaryMuscles: [MuscleGroup.CALVES]
    },
    {
        name: "Cadeira Flexora",
        targetMuscle: MuscleGroup.HAMSTRINGS,
        secondaryMuscles: [MuscleGroup.CALVES]
    },
    {
        name: "Mesa Flexora",
        targetMuscle: MuscleGroup.HAMSTRINGS,
        secondaryMuscles: [MuscleGroup.CALVES]
    },

    // --- 7. Flexão Plantar (Panturrilhas) ---
    {
        name: "Flexão Plantar (Padrão)",
        targetMuscle: MuscleGroup.CALVES,
        secondaryMuscles: []
    },
    {
        name: "Elevação de Panturrilha em Pé",
        targetMuscle: MuscleGroup.CALVES,
        secondaryMuscles: []
    },
    {
        name: "Elevação de Panturrilha Sentado (Máquina)",
        targetMuscle: MuscleGroup.CALVES,
        secondaryMuscles: []
    },
    {
        name: "Elevação de Panturrilha no Leg Press",
        targetMuscle: MuscleGroup.CALVES,
        secondaryMuscles: []
    },

    // --- 8. Isolamentos de Braços, Core e Trapézio ---
    {
        name: "Flexão de Cotovelo (Padrão)",
        targetMuscle: MuscleGroup.BICEPS,
        secondaryMuscles: [MuscleGroup.FOREARMS]
    },
    {
        name: "Rosca Direta com Barra",
        targetMuscle: MuscleGroup.BICEPS,
        secondaryMuscles: [MuscleGroup.FOREARMS]
    },
    {
        name: "Rosca Martelo com Halteres",
        targetMuscle: MuscleGroup.BICEPS,
        secondaryMuscles: [MuscleGroup.FOREARMS]
    },
    {
        name: "Extensão de Cotovelo (Padrão)",
        targetMuscle: MuscleGroup.TRICEPS,
        secondaryMuscles: []
    },
    {
        name: "Tríceps Testa com Barra",
        targetMuscle: MuscleGroup.TRICEPS,
        secondaryMuscles: []
    },
    {
        name: "Tríceps na Polia Alta (Corda)",
        targetMuscle: MuscleGroup.TRICEPS,
        secondaryMuscles: []
    },
    {
        name: "Elevação Escapular (Padrão)",
        targetMuscle: MuscleGroup.TRAPS,
        secondaryMuscles: [MuscleGroup.FOREARMS]
    },
    {
        name: "Encolhimento com Halteres",
        targetMuscle: MuscleGroup.TRAPS,
        secondaryMuscles: [MuscleGroup.FOREARMS]
    },
    {
        name: "Flexão de Tronco (Padrão)",
        targetMuscle: MuscleGroup.CORE,
        secondaryMuscles: []
    },
    {
        name: "Abdominal Crunch Tradicional",
        targetMuscle: MuscleGroup.CORE,
        secondaryMuscles: []
    },
    {
        name: "Prancha Abdominal Isométrica",
        targetMuscle: MuscleGroup.CORE,
        secondaryMuscles: [MuscleGroup.SHOULDERS, MuscleGroup.LOWER_BACK]
    },
    {
        name: "Elevação de Pernas Suspenso (Hanging Leg Raise)",
        targetMuscle: MuscleGroup.CORE,
        secondaryMuscles: [MuscleGroup.QUADRICEPS]
    },
]

async function main() {
    console.log('Iniciando o seeding do banco de dados...');

    for (const ex of exercises) {
        const exercise = await prisma.exercise.upsert({
            where: { name: ex.name },
            update: {
                targetMuscle: ex.targetMuscle,
                secondaryMuscles: ex.secondaryMuscles,
            },
            create: {
                name: ex.name,
                targetMuscle: ex.targetMuscle,
                secondaryMuscles: ex.secondaryMuscles,
            },
        });
        console.log(`Exercício garantido no banco: ${exercise.name}`);
    }

    console.log('Seeding concluído com sucesso.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });