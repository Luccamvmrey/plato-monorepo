import { useState } from "react";
import { formatDateCustom } from "@/core/utils/formatters";
import { UNITS } from "@/core/constants/units";
import { formatWeightPtBr } from "@/features/workouts/utils/progression";
import type { ExerciseExecutionRow } from "@/features/workouts/hooks/useExerciseAnalytics";

const INITIAL_ROWS = 6;

const loadLine = ({ setCount, topLoad }: ExerciseExecutionRow) =>
    topLoad !== null && topLoad > 0
        ? `${setCount} × ${formatWeightPtBr(topLoad)} ${UNITS.WEIGHT}`
        : `${setCount} ${setCount === 1 ? UNITS.SINGLE_SET : UNITS.SETS}`;

/** Uma linha por sessão: o que se compara é uma sessão com a anterior, não série a série. */
export const ExecutionHistoryList = ({ executions }: { executions: ExerciseExecutionRow[] }) => {
    const [showAll, setShowAll] = useState(false);

    const newestFirst = [...executions].reverse();
    const rows = showAll ? newestFirst : newestFirst.slice(0, INITIAL_ROWS);

    return (
        <section className="bg-card border border-border rounded-xl">
            <h2 className="px-4 pt-4 pb-2 text-[15px] font-medium tracking-[-0.02em]">Últimas sessões</h2>

            <ul className="px-4">
                {rows.map((row) => (
                    <li key={row.id} className="flex items-start gap-3 py-3 border-t border-border">
                        <span className="w-12 shrink-0 text-[13px] text-muted-foreground tabular-nums">
                            {formatDateCustom(row.date, "dd/MM")}
                        </span>
                        <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-medium tabular-nums">{loadLine(row)}</p>
                            <p className="text-[13px] text-muted-foreground tabular-nums mt-0.5">
                                {row.isSimple ? "modo simples" : `${row.reps.join(" · ")} ${UNITS.REPS}s`}
                            </p>
                            {row.note && (
                                <p className="text-[12px] text-muted-foreground italic mt-1">{row.note}</p>
                            )}
                        </div>
                        {row.e1rm !== null && (
                            <span className="text-[13px] text-muted-foreground tabular-nums whitespace-nowrap">
                                e1RM {Math.round(row.e1rm)}
                            </span>
                        )}
                    </li>
                ))}
            </ul>

            {newestFirst.length > INITIAL_ROWS && (
                <button
                    type="button"
                    onClick={() => setShowAll((value) => !value)}
                    className="w-full h-12 border-t border-border text-[14px] font-medium text-primary"
                >
                    {showAll ? "Mostrar menos" : `Ver todas (${newestFirst.length})`}
                </button>
            )}
        </section>
    );
};
