import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { prisma, MuscleGroup, LoadType, RepUnit, MovementPattern, Equipment } from "@plato/database";

/** Mesma regra da API (`isAdminUser`): sem `ADMIN_USER_IDS`, ninguém é admin. */
export const isAdminUser = (userId: number): boolean =>
    (process.env.ADMIN_USER_IDS ?? "").split(",").map((id) => id.trim()).includes(String(userId));

const enumOf = <T extends Record<string, string>>(e: T) => z.enum(Object.values(e) as [T[keyof T], ...T[keyof T][]]);

const exerciseInput = z.object({
    name: z.string().trim().min(2).describe("Nome em pt-BR, no padrão do catálogo (ex.: 'Remada Baixa na Polia')"),
    target_muscle: enumOf(MuscleGroup).describe("Músculo alvo principal"),
    secondary_muscles: z.array(enumOf(MuscleGroup)).optional().describe("Músculos secundários"),
    load_type: enumOf(LoadType).optional().describe(
        "Como ler o peso registrado. EXTERNAL (padrão) = peso é a carga; BODYWEIGHT = peso corporal, sem carga; " +
        "BODYWEIGHT_LOADED = peso corporal + lastro; ASSISTED = peso corporal − assistência (ex.: graviton)",
    ),
    rep_unit: enumOf(RepUnit).optional().describe("REPS (padrão) ou SECONDS para isométricos (ex.: prancha)"),
    movement_pattern: enumOf(MovementPattern).describe(
        "Padrão de movimento; é o que define substitutos equivalentes. ISOLATION para monoarticulares",
    ),
    equipment: enumOf(Equipment).describe("Equipamento usado"),
});

export function registerCatalogAdminTools(server: McpServer, requireAuth: () => number) {
    server.registerTool(
        "create_exercises",
        {
            title: "Create Exercises (admin)",
            description:
                "Add new exercises to the GLOBAL catalog, visible to every Plato user. Admin only. " +
                "Before calling, run list_exercises to check the movement is not already there under another name. " +
                "Names that already exist (case-insensitive) are skipped, not duplicated.",
            inputSchema: z.object({
                exercises: z.array(exerciseInput).min(1).max(25),
            }),
        },
        async ({ exercises }) => {
            const userId = requireAuth();
            if (!isAdminUser(userId)) {
                return { content: [{ type: "text" as const, text: "Only admins can write to the exercise catalog." }], isError: true };
            }

            const created: { id: number; name: string }[] = [];
            const skipped: { name: string; existingId: number; existingName: string }[] = [];
            const seen = new Set<string>();

            for (const input of exercises) {
                const key = input.name.toLocaleLowerCase("pt-BR");
                if (seen.has(key)) continue;
                seen.add(key);

                const existing = await prisma.exercise.findFirst({
                    where: { name: { equals: input.name, mode: "insensitive" } },
                    select: { id: true, name: true },
                });
                if (existing) {
                    skipped.push({ name: input.name, existingId: existing.id, existingName: existing.name });
                    continue;
                }

                const exercise = await prisma.exercise.create({
                    data: {
                        name: input.name,
                        targetMuscle: input.target_muscle,
                        secondaryMuscles: (input.secondary_muscles ?? []).filter((m) => m !== input.target_muscle),
                        loadType: input.load_type ?? "EXTERNAL",
                        repUnit: input.rep_unit ?? "REPS",
                        movementPattern: input.movement_pattern,
                        equipment: input.equipment,
                    },
                    select: { id: true, name: true },
                });
                created.push(exercise);
            }

            return { content: [{ type: "text" as const, text: JSON.stringify({ created, skipped }, null, 2) }] };
        },
    );
}
