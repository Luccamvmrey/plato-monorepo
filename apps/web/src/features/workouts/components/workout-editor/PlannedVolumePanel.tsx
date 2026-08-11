import { motion } from "framer-motion";
import { BarChart3, Info } from "lucide-react";
import type { MuscleGroup } from "@plato/database/generated/prisma/enums";
import { MuscleBadge } from "@/core/components/MuscleBadge";
import { muscleGroupTranslation } from "@/core/utils/translations";
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

/** `LOWER_BACK` → `--muscle-lower-back`, como em `index.css`. */
const muscleVar = (muscle: string) => `var(--muscle-${muscle.toLowerCase().replace(/_/g, "-")})`;

/**
 * Volume planejado por grupo muscular, somando este treino aos outros ativos.
 *
 * A barra é de duas partes: o trecho sólido é o que ESTE treino contribui e se move
 * ao vivo enquanto se edita; o translúcido é o resto do ciclo. Sem essa separação o
 * painel mostraria totais dominados pelos outros treinos e não daria para ver o
 * efeito da própria edição.
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
    if (rows.length === 0) return null;

    const maxSets = Math.max(...rows.map((row) => row.cycleSets), 1);
    const fragile = rows.filter((row) => row.onlyThisWorkout);

    return (
        <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                    <BarChart3 className="w-4 h-4 text-muted-foreground shrink-0" />
                    <p className="text-[13px] font-medium text-foreground truncate">
                        Volume planejado
                    </p>
                </div>
                {/* A cadência é a base dos números "×/sem". Deixá-la implícita faria
                    uma estimativa parecer medição. */}
                <span className="text-[11px] font-medium tracking-[0.04em] uppercase text-muted-foreground shrink-0 text-right">
                    {describeCycle(cycleLength, draftIsAddition)}
                    {sessionsPerWeek !== null && ` · ${oneDecimal(sessionsPerWeek)}/sem`}
                </span>
            </div>

            {rows.map((row) => {
                const totalWidth = (row.cycleSets / maxSets) * 100;
                const draftShare = row.cycleSets > 0 ? row.draftSets / row.cycleSets : 0;
                const color = muscleVar(row.muscle);

                return (
                    <div key={row.muscle} className="mb-3 last:mb-0">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                            <MuscleBadge muscle={row.muscle as MuscleGroup} />
                            <span className="text-[12px] text-muted-foreground shrink-0">
                                {plural(row.cycleSets, "série", "séries")}
                                {" · "}
                                {row.perWeek === null
                                    ? `${row.hitWorkouts} de ${cycleLength}`
                                    : `${oneDecimal(row.perWeek)}×/sem`}
                            </span>
                        </div>

                        <div className="h-[3px] bg-muted rounded-full overflow-hidden">
                            <motion.div
                                className="h-full flex rounded-full overflow-hidden"
                                initial={{ width: 0 }}
                                animate={{ width: `${totalWidth}%` }}
                                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                            >
                                <div
                                    className="h-full"
                                    style={{
                                        width: `${draftShare * 100}%`,
                                        background: color,
                                    }}
                                />
                                <div
                                    className="h-full"
                                    style={{
                                        width: `${(1 - draftShare) * 100}%`,
                                        background: color,
                                        opacity: 0.35,
                                    }}
                                />
                            </motion.div>
                        </div>
                    </div>
                );
            })}

            {fragile.length > 0 && (
                <div className="flex items-start gap-3 mt-4 pt-3 border-t border-border">
                    <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-[13px] text-muted-foreground">
                        {fragile.length === 1 ? (
                            <>
                                <span className="text-foreground">
                                    {muscleGroupTranslation[fragile[0].muscle as MuscleGroup]}
                                </span>{" "}
                                só é treinado aqui — se este treino for pulado, o grupo fica sem
                                estímulo na semana.
                            </>
                        ) : (
                            <>
                                <span className="text-foreground">
                                    {fragile
                                        .map((row) => muscleGroupTranslation[row.muscle as MuscleGroup])
                                        .join(", ")}
                                </span>{" "}
                                só são treinados aqui — se este treino for pulado, esses grupos
                                ficam sem estímulo na semana.
                            </>
                        )}
                    </p>
                </div>
            )}
        </div>
    );
};

export default PlannedVolumePanel;
