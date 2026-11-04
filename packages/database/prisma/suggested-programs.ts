/**
 * Programas sugeridos pelo Plato. RASCUNHO até a revisão do dono do app: nada daqui vai ao
 * ar sem `APPLY=1 npx ts-node prisma/publish-suggested-programs.ts`.
 *
 * `targetReps` é o início da faixa: a progressão do app trabalha de `targetReps` a
 * `targetReps + 2`. Em exercício de tempo (`repUnit: SECONDS`), o valor é em segundos.
 * Os nomes precisam ser idênticos aos do catálogo, e o script falha se algum não bater.
 */
export interface SuggestedExercise {
    name: string;
    sets: number;
    reps: number;
    observation?: string;
}

export interface SuggestedWorkout {
    name: string;
    description?: string;
    exercises: SuggestedExercise[];
}

export interface SuggestedProgram {
    /** Chave estável: republicar com a mesma chave mantém o link. */
    key: string;
    name: string;
    description: string;
    focusLabel: string;
    sessionsPerWeek: number;
    workouts: SuggestedWorkout[];
}

export const SUGGESTED_PROGRAMS: SuggestedProgram[] = [
    {
        key: "corpo-inteiro-3x",
        name: "Corpo inteiro",
        description: "Para quem está começando ou voltando. Dois treinos que se alternam e trabalham o corpo todo a cada sessão.",
        focusLabel: "Iniciantes",
        sessionsPerWeek: 3,
        workouts: [
            {
                name: "Corpo inteiro A",
                exercises: [
                    { name: "Leg Press 45º", sets: 3, reps: 10 },
                    { name: "Supino Reto com Halteres", sets: 3, reps: 10 },
                    { name: "Remada Baixa na Polia", sets: 3, reps: 10 },
                    { name: "Desenvolvimento com Halteres", sets: 2, reps: 10 },
                    { name: "Cadeira Flexora", sets: 2, reps: 12 },
                    { name: "Prancha Abdominal Isométrica", sets: 3, reps: 30 },
                ],
            },
            {
                name: "Corpo inteiro B",
                exercises: [
                    { name: "Levantamento Terra Romeno (RDL)", sets: 3, reps: 10 },
                    { name: "Puxada Frontal na Polia", sets: 3, reps: 10 },
                    { name: "Supino Inclinado com Halteres", sets: 3, reps: 10 },
                    { name: "Cadeira Extensora", sets: 2, reps: 12 },
                    { name: "Elevação Lateral com Halteres", sets: 2, reps: 12 },
                    { name: "Abdominal Crunch Tradicional", sets: 3, reps: 12 },
                ],
            },
        ],
    },
    {
        key: "abc-3x",
        name: "ABC clássico",
        description: "Peito, ombros e tríceps; costas e bíceps; pernas. Cada grupo recebe mais volume, com mais descanso entre as sessões.",
        focusLabel: "Hipertrofia",
        sessionsPerWeek: 3,
        workouts: [
            {
                name: "A: peito, ombros e tríceps",
                exercises: [
                    { name: "Supino Reto com Barra", sets: 4, reps: 8 },
                    { name: "Supino Inclinado com Halteres", sets: 3, reps: 10 },
                    { name: "Crossover na Polia", sets: 3, reps: 12 },
                    { name: "Desenvolvimento com Halteres", sets: 3, reps: 10 },
                    { name: "Elevação Lateral com Halteres", sets: 3, reps: 12 },
                    { name: "Tríceps na Polia Alta (Corda)", sets: 3, reps: 12 },
                ],
            },
            {
                name: "B: costas e bíceps",
                exercises: [
                    { name: "Puxada Frontal na Polia", sets: 4, reps: 8 },
                    { name: "Remada Curvada com Barra", sets: 3, reps: 8 },
                    { name: "Remada Baixa na Polia", sets: 3, reps: 10 },
                    { name: "Face Pull na Polia", sets: 3, reps: 12 },
                    { name: "Rosca Direta com Barra", sets: 3, reps: 10 },
                    { name: "Rosca Martelo com Halteres", sets: 2, reps: 12 },
                ],
            },
            {
                name: "C: pernas",
                exercises: [
                    { name: "Agachamento Livre com Barra", sets: 4, reps: 8 },
                    { name: "Levantamento Terra Romeno (RDL)", sets: 3, reps: 10 },
                    { name: "Leg Press 45º", sets: 3, reps: 10 },
                    { name: "Cadeira Flexora", sets: 3, reps: 12 },
                    { name: "Cadeira Extensora", sets: 2, reps: 12 },
                    { name: "Elevação de Panturrilha em Pé", sets: 4, reps: 12 },
                ],
            },
        ],
    },
    {
        key: "superior-inferior-4x",
        name: "Superior e inferior",
        description: "Quatro treinos na semana, cada grupo treinado duas vezes: um dia mais pesado e outro com mais repetições.",
        focusLabel: "Intermediários",
        sessionsPerWeek: 4,
        workouts: [
            {
                name: "Superior pesado",
                exercises: [
                    { name: "Supino Reto com Barra", sets: 4, reps: 6 },
                    { name: "Remada Curvada com Barra", sets: 4, reps: 6 },
                    { name: "Desenvolvimento com Barra", sets: 3, reps: 8 },
                    { name: "Puxada Frontal na Polia", sets: 3, reps: 8 },
                    { name: "Rosca Direta com Barra", sets: 2, reps: 10 },
                    { name: "Tríceps Testa com Barra", sets: 2, reps: 10 },
                ],
            },
            {
                name: "Inferior pesado",
                exercises: [
                    { name: "Agachamento Livre com Barra", sets: 4, reps: 6 },
                    { name: "Levantamento Terra Romeno (RDL)", sets: 3, reps: 8 },
                    { name: "Leg Press 45º", sets: 3, reps: 10 },
                    { name: "Mesa Flexora", sets: 3, reps: 10 },
                    { name: "Elevação de Panturrilha em Pé", sets: 4, reps: 10 },
                ],
            },
            {
                name: "Superior leve",
                exercises: [
                    { name: "Supino Inclinado com Halteres", sets: 3, reps: 10 },
                    { name: "Remada Baixa na Polia", sets: 3, reps: 10 },
                    { name: "Elevação Lateral com Halteres", sets: 3, reps: 12 },
                    { name: "Crossover na Polia", sets: 3, reps: 12 },
                    { name: "Face Pull na Polia", sets: 3, reps: 12 },
                    { name: "Rosca Martelo com Halteres", sets: 2, reps: 12 },
                    { name: "Tríceps na Polia Alta (Corda)", sets: 2, reps: 12 },
                ],
            },
            {
                name: "Inferior leve",
                exercises: [
                    { name: "Agachamento Búlgaro com Halteres", sets: 3, reps: 10 },
                    { name: "Elevação Pélvica com Barra", sets: 3, reps: 10 },
                    { name: "Cadeira Extensora", sets: 3, reps: 12 },
                    { name: "Cadeira Flexora", sets: 3, reps: 12 },
                    { name: "Elevação de Panturrilha Sentado (Máquina)", sets: 3, reps: 12 },
                    { name: "Abdominal Crunch Tradicional", sets: 3, reps: 12 },
                ],
            },
        ],
    },
    {
        key: "empurrar-puxar-pernas",
        name: "Empurrar, puxar e pernas",
        description: "Três treinos em rotação, sem prender a dias da semana. Faça três vezes por semana, ou mais se tiver tempo para recuperar.",
        focusLabel: "Intermediários",
        sessionsPerWeek: 3,
        workouts: [
            {
                name: "Empurrar",
                exercises: [
                    { name: "Supino Reto com Barra", sets: 4, reps: 8 },
                    { name: "Desenvolvimento com Halteres", sets: 3, reps: 8 },
                    { name: "Supino Inclinado com Halteres", sets: 3, reps: 10 },
                    { name: "Elevação Lateral com Halteres", sets: 4, reps: 12 },
                    { name: "Tríceps na Polia Alta (Corda)", sets: 3, reps: 10 },
                ],
            },
            {
                name: "Puxar",
                exercises: [
                    { name: "Barra Fixa Pronada", sets: 4, reps: 6, observation: "Sem conseguir 6 repetições, troque por Puxada Frontal na Polia." },
                    { name: "Remada Curvada com Barra", sets: 3, reps: 8 },
                    { name: "Remada Unilateral com Halter", sets: 3, reps: 10 },
                    { name: "Face Pull na Polia", sets: 3, reps: 12 },
                    { name: "Rosca Direta com Barra", sets: 3, reps: 10 },
                ],
            },
            {
                name: "Pernas",
                exercises: [
                    { name: "Agachamento Livre com Barra", sets: 4, reps: 8 },
                    { name: "Stiff com Barra", sets: 3, reps: 10 },
                    { name: "Agachamento Búlgaro com Halteres", sets: 3, reps: 10 },
                    { name: "Cadeira Flexora", sets: 3, reps: 12 },
                    { name: "Elevação de Panturrilha em Pé", sets: 4, reps: 12 },
                ],
            },
        ],
    },
    {
        key: "foco-gluteo-3x",
        name: "Foco em glúteo",
        description: "Glúteo treinado em todas as sessões, sem abandonar o resto do corpo.",
        focusLabel: "Glúteo",
        sessionsPerWeek: 3,
        workouts: [
            {
                name: "Glúteo pesado",
                exercises: [
                    { name: "Elevação Pélvica com Barra", sets: 4, reps: 8 },
                    { name: "Agachamento Livre com Barra", sets: 3, reps: 8 },
                    { name: "Levantamento Terra Romeno (RDL)", sets: 3, reps: 10 },
                    { name: "Cadeira Flexora", sets: 3, reps: 12 },
                ],
            },
            {
                name: "Superior e glúteo",
                exercises: [
                    { name: "Agachamento Búlgaro com Halteres", sets: 3, reps: 10 },
                    { name: "Puxada Frontal na Polia", sets: 3, reps: 10 },
                    { name: "Supino Reto com Halteres", sets: 3, reps: 10 },
                    { name: "Remada Baixa na Polia", sets: 3, reps: 10 },
                    { name: "Elevação Lateral com Halteres", sets: 3, reps: 12 },
                ],
            },
            {
                name: "Glúteo com volume",
                exercises: [
                    { name: "Elevação Pélvica com Barra", sets: 3, reps: 12 },
                    { name: "Passada / Afundo com Halteres", sets: 3, reps: 12 },
                    { name: "Leg Press 45º", sets: 3, reps: 12, observation: "Pés altos na plataforma para dar mais trabalho ao glúteo." },
                    { name: "Mesa Flexora", sets: 3, reps: 12 },
                    { name: "Elevação de Panturrilha em Pé", sets: 3, reps: 12 },
                ],
            },
        ],
    },
    {
        key: "foco-ombros-3x",
        name: "Foco em ombros",
        description: "Mais volume para ombros, distribuído em três treinos, com peito, costas e pernas em manutenção.",
        focusLabel: "Ombros",
        sessionsPerWeek: 3,
        workouts: [
            {
                name: "Ombros e empurrar",
                exercises: [
                    { name: "Desenvolvimento com Barra", sets: 4, reps: 6 },
                    { name: "Elevação Lateral com Halteres", sets: 4, reps: 12 },
                    { name: "Supino Inclinado com Halteres", sets: 3, reps: 10 },
                    { name: "Tríceps na Polia Alta (Corda)", sets: 3, reps: 12 },
                ],
            },
            {
                name: "Ombros e puxar",
                exercises: [
                    { name: "Puxada Frontal na Polia", sets: 3, reps: 8 },
                    { name: "Remada Baixa na Polia", sets: 3, reps: 10 },
                    { name: "Crucifixo Inverso na Máquina (Peck Deck Inverso)", sets: 4, reps: 12 },
                    { name: "Elevação Lateral na Polia", sets: 3, reps: 12 },
                    { name: "Rosca Direta com Barra", sets: 2, reps: 10 },
                ],
            },
            {
                name: "Pernas e ombros",
                exercises: [
                    { name: "Agachamento Livre com Barra", sets: 3, reps: 8 },
                    { name: "Levantamento Terra Romeno (RDL)", sets: 3, reps: 10 },
                    { name: "Desenvolvimento com Halteres", sets: 3, reps: 10 },
                    { name: "Face Pull na Polia", sets: 3, reps: 12 },
                    { name: "Elevação Lateral com Halteres", sets: 3, reps: 12 },
                ],
            },
        ],
    },
];
