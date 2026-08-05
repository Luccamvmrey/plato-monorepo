import { useState, useEffect, useRef, type KeyboardEvent } from "react";

export type SetSubmissionData = {
    actualWeight: number;
    actualReps: number;
    rpe: number;
    equipmentWeight?: number;
};

const DEFAULT_RPE = "8";

// O app é pt-BR, onde a vírgula é o separador decimal. Os inputs de carga são
// type="text" justamente porque type="number" descarta a vírgula antes de qualquer
// parser ver o valor — "82,5" chegaria aqui como "". Normalizamos na leitura.
const parseDecimal = (value: string) => Math.max(0, parseFloat(value.replace(",", ".")) || 0);

type UseActiveSetInputProps = {
    setNumber: number;
    targetReps: number;
    previousWeight?: number;
    previousEquipmentWeight?: number;
    onConfirm: (data: SetSubmissionData) => void;
    isPending: boolean;
};

export const useActiveSetInput = ({
    setNumber,
    targetReps,
    previousWeight,
    previousEquipmentWeight,
    onConfirm,
    isPending
}: UseActiveSetInputProps) => {
    const [weight, setWeight] = useState<string>(previousWeight?.toString() || "");
    const [reps, setReps] = useState<string>(targetReps.toString());
    const [rpe, setRpe] = useState<string>(DEFAULT_RPE);
    const [equipmentWeight, setEquipmentWeight] = useState<string>(previousEquipmentWeight?.toString() || "");
    const [wasSubmitted, setWasSubmitted] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const weightRef = useRef<HTMLInputElement>(null);
    const repsRef = useRef<HTMLInputElement>(null);
    const equipmentRef = useRef<HTMLInputElement>(null);
    const prevSetNumberRef = useRef(setNumber);
    // Precisa ser capturado no confirm, não no efeito: os inputs ficam disabled
    // enquanto wasSubmitted é true, e isso já jogou o foco para o <body> antes do
    // efeito de troca de set rodar.
    const shouldRefocusRef = useRef(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setWasSubmitted(false);
        if (previousWeight) {
            setWeight(previousWeight.toString());
        }
        if (previousEquipmentWeight) {
            setEquipmentWeight(previousEquipmentWeight.toString());
        }
    }, [setNumber, previousWeight, previousEquipmentWeight]);

    // Reps e RPE são específicos do set — herdá-los do set anterior é conveniente
    // na maioria das vezes e silenciosamente errado no resto. A carga continua
    // sendo herdada de propósito (vem de useExerciseSuggestions).
    // Guardado por ref para só disparar quando o set realmente virou, e não quando
    // uma das outras deps do efeito acima mudar no meio da digitação.
    useEffect(() => {
        if (prevSetNumberRef.current === setNumber) return;
        prevSetNumberRef.current = setNumber;

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setReps(targetReps.toString());
        setRpe(DEFAULT_RPE);
    }, [setNumber, targetReps]);

    // Devolve o foco ao campo de carga do set novo. Tem que ser um efeito separado
    // esperando wasSubmitted virar false: enquanto ele é true os inputs estão
    // disabled, e não se dá focus() num input disabled — era isso que fazia o foco
    // cair no <body> depois de cada set.
    useEffect(() => {
        if (wasSubmitted || !shouldRefocusRef.current) return;

        shouldRefocusRef.current = false;
        weightRef.current?.focus({ preventScroll: true });
        weightRef.current?.select();
    }, [wasSubmitted]);

    const handleConfirm = () => {
        if (isPending || wasSubmitted) return;

        const parsedWeight = parseDecimal(weight);
        const parsedReps = Math.max(0, parseInt(reps, 10) || 0);
        // Clamp RPE between 1 and 10
        const parsedRpe = Math.min(10, Math.max(1, parseInt(rpe, 10) || 8));
        const parsedEquipmentWeight = equipmentWeight ? parseDecimal(equipmentWeight) : undefined;

        if (parsedReps === 0 && parsedWeight === 0) return; // Basic validation

        // Enquanto o foco ainda está dentro do card — daqui a um tick os inputs
        // ficam disabled e o foco cai no <body>.
        shouldRefocusRef.current = !!containerRef.current?.contains(document.activeElement);

        setWasSubmitted(true);
        onConfirm({
            actualWeight: parsedWeight,
            actualReps: parsedReps,
            rpe: parsedRpe,
            equipmentWeight: parsedEquipmentWeight
        });
    };

    // Enter avança o campo em vez de fazer nada: carga → reps → (barra) → confirmar.
    const handleFieldKeyDown = (field: "weight" | "reps" | "equipment") =>
        (e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key !== "Enter") return;
            e.preventDefault();

            const next = field === "weight"
                ? repsRef.current
                : field === "reps" && equipmentRef.current
                    ? equipmentRef.current
                    : null;

            if (next) {
                next.focus();
                next.select();
                return;
            }

            handleConfirm();
        };

    return {
        state: {
            weight,
            reps,
            rpe,
            equipmentWeight,
            wasSubmitted
        },
        refs: {
            containerRef,
            weightRef,
            repsRef,
            equipmentRef
        },
        actions: {
            setWeight,
            setReps,
            setRpe,
            setEquipmentWeight,
            handleConfirm,
            handleFieldKeyDown
        }
    };
};
