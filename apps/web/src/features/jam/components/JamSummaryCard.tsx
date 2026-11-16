import { Users } from "lucide-react";
import type { JamSummary } from "@plato/shared";
import { describeJamSummaryRow } from "@/features/jam/utils/jam-summary.ts";
import { JamAvatar } from "./JamAvatar.tsx";

/** No resumo da sessão: como foi o treino de cada um na jam. */
export const JamSummaryCard = ({ summary }: { summary: JamSummary }) => (
    <section aria-labelledby="jam-summary-title" className="p-4 rounded-xl bg-card border border-border flex flex-col gap-2">
        <h2 id="jam-summary-title" className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.01em]">
            <Users className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="min-w-0">{summary.title}</span>
        </h2>
        <ul>
            {summary.rows.map((row) => {
                const { main, detail } = describeJamSummaryRow(row);

                return (
                    <li key={row.userId} className="flex items-center gap-3 py-2 border-t border-border first:border-t-0">
                        <JamAvatar name={row.name} className="size-8 text-[13px]" />
                        <span className="flex-1 min-w-0 text-[14px] truncate">
                            {row.name}
                            {row.isMe && <span className="text-muted-foreground"> (você)</span>}
                        </span>
                        <span className="shrink-0 text-right tabular-nums">
                            <span className="block text-[14px] font-medium">{main}</span>
                            {detail && (
                                <span className={row.status === "DONE" ? "block text-[12px] text-pr" : "block text-[12px] text-muted-foreground"}>
                                    {detail}
                                </span>
                            )}
                        </span>
                    </li>
                );
            })}
        </ul>
    </section>
);
