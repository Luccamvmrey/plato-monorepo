import { useState, useEffect, useRef, type KeyboardEvent } from "react";
import { parseDecimalPtBr } from "@/core/utils/formatters";

export type SetSubmissionData = {
    actualWeight: number;
    actualReps: number;
    rpe: number;
    equipmentWeight?: number;
};

const DEFAULT_RPE = "8";

// Compartilhado com o card de peso corporal: mesma armadilha da vírgula.
const parseDecimal = parseDecimalPtBr;

/** O que preenche os campos do set. `weight` null = ainda não há carga de referência. */
export type SetSeed = {
    weight: number | null;
    equipmentWeight: number | null;
    reps: number;
};

type UseActiveSetInputProps = {
    exerciseId: number;
    setNumber: number;
    seed: SetSeed;
    onConfirm: (data: SetSubmissionData) => void;
    isPending: boolean;
};

/** != null e não truthiness: 0 kg (peso corporal, máquina assistida) é carga legítima. */
const toInputValue = (value: number | null | undefined) => value != null ? value.toString() : "";

export const useActiveSetInput = ({
    exerciseId,
    setNumber,
    seed,
    onConfirm,
    isPending
}: UseActiveSetInputProps) => {
    const [weight, setWeight] = useState<string>(toInputValue(seed.weight));
    const [reps, setReps] = useState<string>(seed.reps.toString());
    const [rpe, setRpe] = useState<string>(DEFAULT_RPE);
    const [equipmentWeight, setEquipmentWeight] = useState<string>(toInputValue(seed.equipmentWeight));
    const [wasSubmitted, setWasSubmitted] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const weightRef = useRef<HTMLInputElement>(null);
    const repsRef = useRef<HTMLInputElement>(null);
    const equipmentRef = useRef<HTMLInputElement>(null);
    // O par (exercício, set) é a identidade do que está sendo preenchido. Dois refs
    // porque as duas coisas abaixo têm cadências diferentes: o reset acontece toda
    // vez que o par muda, a semeadura no máximo uma vez por par.
    const pairKey = `${exerciseId}:${setNumber}`;
    const resetPairRef = useRef(pairKey);
    const seededPairRef = useRef(seed.weight != null ? pairKey : null);
    // Par em que o usuário já digitou. Histórico que chega tarde não pisa nele.
    const dirtyPairRef = useRef<string | null>(null);
    // Precisa ser capturado no confirm, não no efeito: os inputs ficam disabled
    // enquanto wasSubmitted é true, e isso já jogou o foco para o <body> antes do
    // efeito de troca de set rodar.
    const shouldRefocusRef = useRef(false);

    // Reset por set. Reps e RPE são específicos do set — herdá-los do anterior é
    // conveniente na maioria das vezes e silenciosamente errado no resto. A carga
    // continua sendo herdada de propósito, pela semeadura abaixo.
    useEffect(() => {
        if (resetPairRef.current === pairKey) return;
        resetPairRef.current = pairKey;

        /* eslint-disable react-hooks/set-state-in-effect */
        setWasSubmitted(false);
        setReps(seed.reps.toString());
        setRpe(DEFAULT_RPE);
        /* eslint-enable react-hooks/set-state-in-effect */
    }, [pairKey, seed.reps]);

    // Semeadura one-shot por par. Antes, o peso era dependência do efeito de reset,
    // então um valor que chegasse (ou mudasse) no meio da digitação sobrescrevia o
    // que o usuário já tinha escrito. Marcar o par como semeado cobre a chegada
    // tardia do histórico sem nunca pisar na digitação; se o histórico vier vazio o
    // campo simplesmente fica em branco.
    useEffect(() => {
        if (seededPairRef.current === pairKey || seed.weight == null) return;
        if (dirtyPairRef.current === pairKey) {
            seededPairRef.current = pairKey;
            return;
        }
        seededPairRef.current = pairKey;

        /* eslint-disable react-hooks/set-state-in-effect */
        setWeight(toInputValue(seed.weight));
        setReps(seed.reps.toString());
        setEquipmentWeight(toInputValue(seed.equipmentWeight));
        /* eslint-enable react-hooks/set-state-in-effect */
    }, [pairKey, seed.weight, seed.equipmentWeight, seed.reps]);

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

    // Toda escrita vinda do usuário marca o par como sujo, para a semeadura tardia
    // saber que não tem mais nada a preencher ali.
    const markDirty = () => { dirtyPairRef.current = pairKey; };
    const handleWeightChange = (value: string) => { markDirty(); setWeight(value); };
    const handleRepsChange = (value: string) => { markDirty(); setReps(value); };
    const handleRpeChange = (value: string) => { markDirty(); setRpe(value); };
    const handleEquipmentWeightChange = (value: string) => { markDirty(); setEquipmentWeight(value); };

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
            setWeight: handleWeightChange,
            setReps: handleRepsChange,
            setRpe: handleRpeChange,
            setEquipmentWeight: handleEquipmentWeightChange,
            handleConfirm,
            handleFieldKeyDown
        }
    };
};
