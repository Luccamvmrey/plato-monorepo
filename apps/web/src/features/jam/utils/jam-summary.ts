import type { JamSummaryRow } from "@plato/shared";
import { UNITS } from "@/core/constants/units";

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/**
 * O resultado de uma pessoa na jam, em texto. O card e a imagem de compartilhar usam o mesmo,
 * para a imagem nunca dizer outra coisa que a tela.
 *
 * Volume quando há (no modo simples sem carga não há); senão, as séries.
 */
export const describeJamSummaryRow = (row: JamSummaryRow): { main: string; detail: string | null } => {
    const main = row.volume > 0
        ? `${Math.round(row.volume).toLocaleString("pt-BR")} ${UNITS.WEIGHT}`
        : plural(row.sets, "série", "séries");

    if (row.status === "TRAINING") return { main, detail: "treinando" };
    if (row.status === "LEFT") return { main, detail: "saiu antes" };

    return { main, detail: row.recordCount ? plural(row.recordCount, "recorde", "recordes") : null };
};
