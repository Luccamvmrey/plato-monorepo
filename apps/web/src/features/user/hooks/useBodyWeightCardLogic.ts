import { useState } from "react";
import { parseDecimalPtBr } from "@/core/utils/formatters";
import { useBodyWeight } from "./useBodyWeight";

const MIN_WEIGHT = 20;
const MAX_WEIGHT = 400;

/** Data local no formato do input `date`. `toISOString()` seria UTC e erraria o dia. */
const todayLocal = (): string =>
    new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" })
        .format(new Date());

/**
 * Converte YYYY-MM-DD para um instante ao MEIO-DIA local.
 *
 * `new Date("2026-08-10")` é meia-noite UTC, que em UTC-3 cai no dia 9. O meio-dia
 * mantém a data pretendida em qualquer fuso.
 */
const toLocalNoon = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
};

export const useBodyWeightCardLogic = () => {
    const { logs, current, isLoading, createBodyWeight, isCreating, deleteBodyWeight, isDeleting } = useBodyWeight();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [weight, setWeight] = useState("");
    const [measuredAt, setMeasuredAt] = useState(todayLocal);
    const [error, setError] = useState<string | null>(null);

    const openForm = () => {
        setWeight(current ? String(current.weight).replace(".", ",") : "");
        setMeasuredAt(todayLocal());
        setError(null);
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setError(null);
    };

    const handleSubmit = () => {
        if (isCreating) return;

        const parsed = parseDecimalPtBr(weight);

        if (parsed < MIN_WEIGHT || parsed > MAX_WEIGHT) {
            setError(`Informe um peso entre ${MIN_WEIGHT} e ${MAX_WEIGHT} kg.`);
            return;
        }

        if (!measuredAt) {
            setError("Informe a data da medição.");
            return;
        }

        setError(null);
        createBodyWeight(
            { weight: parsed, measuredAt: toLocalNoon(measuredAt).toISOString() },
            { onSuccess: () => setIsFormOpen(false) }
        );
    };

    return {
        logs,
        current,
        isLoading,
        isFormOpen,
        openForm,
        closeForm,
        weight,
        setWeight,
        measuredAt,
        setMeasuredAt,
        error,
        handleSubmit,
        isCreating,
        deleteBodyWeight,
        isDeleting,
    };
};
