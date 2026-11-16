import { formatWeight } from "@/core/utils/formatters.ts";
import type { JamMyTurn } from "@/features/jam/hooks/useJamTurn.ts";

const describeTurn = ({ previousName, plateSwap }: JamMyTurn): string => {
    if (plateSwap && previousName) {
        const verb = plateSwap.action === "ADD" ? "coloque" : "tire";

        return `${previousName} usou ${formatWeight(plateSwap.fromKg)}, você vai de ${formatWeight(plateSwap.toKg)}: ` +
            `${verb} ${formatWeight(plateSwap.perSideKg)} de cada lado.`;
    }

    return previousName ? `${previousName} terminou a série. O aparelho é seu.` : "O aparelho é seu.";
};

/** No revezamento, a vez chegou. Fica acima do card para ser a primeira coisa que se vê. */
export const JamMyTurnBanner = ({ myTurn }: { myTurn: JamMyTurn }) => (
    <div role="status" className="rounded-xl border-2 border-primary/60 bg-primary/10 px-4 py-3">
        <p className="text-[15px] font-semibold text-primary">Sua vez</p>
        <p className="text-[14px] mt-0.5">{describeTurn(myTurn)}</p>
    </div>
);
