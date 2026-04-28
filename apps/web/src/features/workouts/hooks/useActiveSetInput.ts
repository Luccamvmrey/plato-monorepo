import { useState, useEffect } from "react";

export type SetSubmissionData = {
    actualWeight: number;
    actualReps: number;
    rpe: number;
    equipmentWeight?: number;
};

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
    const [rpe, setRpe] = useState<string>("8");
    const [equipmentWeight, setEquipmentWeight] = useState<string>(previousEquipmentWeight?.toString() || "");
    const [wasSubmitted, setWasSubmitted] = useState(false);

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

    const handleConfirm = () => {
        if (isPending || wasSubmitted) return;

        const parsedWeight = Math.max(0, parseFloat(weight) || 0);
        const parsedReps = Math.max(0, parseInt(reps, 10) || 0);
        // Clamp RPE between 1 and 10
        const parsedRpe = Math.min(10, Math.max(1, parseInt(rpe, 10) || 8));
        const parsedEquipmentWeight = equipmentWeight ? Math.max(0, parseFloat(equipmentWeight) || 0) : undefined;

        if (parsedReps === 0 && parsedWeight === 0) return; // Basic validation

        setWasSubmitted(true);
        onConfirm({
            actualWeight: parsedWeight,
            actualReps: parsedReps,
            rpe: parsedRpe,
            equipmentWeight: parsedEquipmentWeight
        });
    };

    return {
        state: {
            weight,
            reps,
            rpe,
            equipmentWeight,
            wasSubmitted
        },
        actions: {
            setWeight,
            setReps,
            setRpe,
            setEquipmentWeight,
            handleConfirm
        }
    };
};
