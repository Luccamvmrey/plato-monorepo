import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { MuscleGroup } from "@plato/database/generated/prisma/enums";
import { muscleGroupTranslation } from "@/core/utils/translations";
import { cn } from "@/lib/utils";
import type { PlannedVolumeRow } from "@/features/workouts/hooks/usePlannedVolume.ts";

type PlannedVolumePanelProps = {
    rows: PlannedVolumeRow[];
    cycleLength: number;
    sessionsPerWeek: number | null;
    draftIsAddition: boolean;
};

/**
 * Composição do ciclo, em texto.
 *
 * "2 treinos" sozinho parecia erro quando havia 1 treino ativo: o painel conta o ciclo
 * COM o treino em edição, e não dizia isso. Quando o rascunho é uma adição, a soma
 * fica explícita — "1 ativo + este" não deixa dúvida de onde vem o número.
 */
const describeCycle = (cycleLength: number, draftIsAddition: boolean): string => {
    if (!draftIsAddition) {
        return `${cycleLength} ${cycleLength === 1 ? "treino ativo" : "treinos ativos"}`;
    }

    const saved = cycleLength - 1;

    if (saved === 0) return "só este treino";

    return `${saved} ${saved === 1 ? "ativo" : "ativos"} + este`;
};

const oneDecimal = (value: number) =>
    value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const plural = (n: number, singular: string, plural: string) =>
    `${n} ${n === 1 ? singular : plural}`;

const muscleName = (muscle: string) => muscleGroupTranslation[muscle as MuscleGroup];

/**
 * Volume planejado por grupo muscular, somando este treino aos outros ativos.
 *
 * A barra é de duas partes: o trecho sólido é o que ESTE treino contribui e se move
 * ao vivo enquanto se edita; o translúcido é o resto do ciclo. Sem essa separação o
 * painel mostraria totais dominados pelos outros treinos e não daria para ver o
 * efeito da própria edição.
 *
 * Fechado por padrão: é consulta, não parte de montar o treino. O aviso de grupo que só
 * este treino atinge continua visível na linha de resumo, que é o que pede decisão.
 *
 * A unidade é série planejada, não tonelagem — ver `planned-volume.ts`. Informativo,
 * nunca bloqueante: mesma regra do `RedundancyNotice`.
 */
const PlannedVolumePanel = ({
    rows,
    cycleLength,
    sessionsPerWeek,
    draftIsAddition,
}: PlannedVolumePanelProps) => {
    const [isOpen, setIsOpen] = useState(false);

    if (rows.length === 0) return null;

    const maxSets = Math.max(...rows.map((row) => row.cycleSets), 1);
    const fragile = rows.filter((row) => row.onlyThisWorkout);

    return (
        <section className="bg-card border border-border rounded-xl">
            <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setIsOpen((open) => !open)}
                className="w-full flex items-start gap-3 p-4 text-left"
            >
                <div className="flex-1 min-w-0">
                    <h2 className="text-[14px] font-medium">Volume planejado</h2>
                    {/* A cadência é a base dos números "×/sem". Deixá-la implícita faria
                        uma estimativa parecer medição. */}
                    <p className="text-[13px] text-muted-foreground mt-0.5">
                        {describeCycle(cycleLength, draftIsAddition)}
                        {sessionsPerWeek !== null && ` · ${oneDecimal(sessionsPerWeek)} por semana`}
                    </p>
                    {fragile.length > 0 && (
                        <p className="text-[13px] text-muted-foreground mt-2">
                            <span className="text-foreground font-medium">
                                {fragile.map((row) => muscleName(row.muscle)).join(", ")}
                            </span>{" "}
                            {fragile.length === 1
                                ? "só é treinado aqui. Se este treino for pulado, o grupo fica sem estímulo na semana."
                                : "só são treinados aqui. Se este treino for pulado, esses grupos ficam sem estímulo na semana."}
                        </p>
                    )}
                </div>
                <ChevronDown className={cn(
                    "size-4 mt-0.5 text-muted-foreground shrink-0 transition-transform duration-200",
                    isOpen && "rotate-180"
                )} />
            </button>

            {isOpen && (
                <div className="flex flex-col gap-3 px-4 pb-4">
                    {rows.map((row) => {
                        const totalWidth = (row.cycleSets / maxSets) * 100;
                        const draftShare = row.cycleSets > 0 ? row.draftSets / row.cycleSets : 0;

                        return (
                            <div key={row.muscle} className="flex flex-col gap-1.5">
                                <div className="flex items-baseline justify-between gap-2">
                                    <span className="text-[14px]">{muscleName(row.muscle)}</span>
                                    <span className="text-[13px] text-muted-foreground tabular-nums shrink-0">
                                        {plural(row.cycleSets, "série", "séries")}
                                        {" · "}
                                        {row.perWeek === null
                                            ? `${row.hitWorkouts} de ${cycleLength}`
                                            : `${oneDecimal(row.perWeek)}×/sem`}
                                    </span>
                                </div>

                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full flex rounded-full overflow-hidden"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${totalWidth}%` }}
                                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                    >
                                        <div className="h-full bg-primary" style={{ width: `${draftShare * 100}%` }} />
                                        <div className="h-full bg-primary/35" style={{ width: `${(1 - draftShare) * 100}%` }} />
                                    </motion.div>
                                </div>
                            </div>
                        );
                    })}
                    <p className="text-[12px] text-muted-foreground">
                        Barra cheia: este treino. Barra clara: os outros treinos ativos.
                    </p>
                </div>
            )}
        </section>
    );
};

export default PlannedVolumePanel;
