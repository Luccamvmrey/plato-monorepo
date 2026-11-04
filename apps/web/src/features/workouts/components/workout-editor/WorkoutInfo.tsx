import { Label } from "@/components/ui/label.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Trash2, X } from "lucide-react";
import DeletionAlertDialog from "@/core/components/DeletionAlertDialog.tsx";
import { useWorkoutInfoLogic } from "@/features/workouts/hooks/useWorkoutInfoLogic.ts";
import { focusNextField } from "@/core/utils/focus.ts";
import { cn } from "@/lib/utils";
import type { TrackingMode } from "@/features/workouts/workout.types.ts";
import type { KeyboardEvent } from "react";

interface WorkoutInfoProps {
    nameError?: string;
    onNameBlur?: (value: string) => void;
    onNameChange?: (value: string) => void;
}

const TRACKING_MODES: { value: TrackingMode; label: string; description: string }[] = [
    {
        value: "FULL",
        label: "Completo",
        description: "Carga, repetições e RPE em cada série, com sugestão de progressão e recordes.",
    },
    {
        value: "SIMPLE",
        label: "Simplificado",
        description: "Um toque por série e peso opcional no fim do exercício. Sem sugestão de progressão e sem recordes.",
    },
];

/** Enter advances to the next field instead of submitting a half-filled workout. */
const handleFieldKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (!focusNextField(e.currentTarget)) e.currentTarget.blur();
};

const WorkoutInfo = ({ nameError, onNameBlur, onNameChange }: WorkoutInfoProps) => {
    const {
        id,
        title,
        name,
        description,
        trackingMode,
        setTrackingMode,
        setWorkoutInfo,
        handleBack,
        handleDelete,
    } = useWorkoutInfoLogic();

    return (
        <div className="flex flex-col gap-6">
            <div className="flex w-full items-center justify-between px-1">
                <h1 className="text-xl font-medium tracking-tight">{title} Treino</h1>

                {id === "new" ? (
                    <Button variant="ghost" size="icon" className="rounded-full" type="button" onClick={handleBack} aria-label="Fechar editor">
                        <X className="size-5" />
                    </Button>
                ) : (
                    <DeletionAlertDialog onConfirm={handleDelete}>
                        <Button variant="ghost" size="icon" className="rounded-full text-destructive" type="button" aria-label="Excluir treino">
                            <Trash2 className="size-5" />
                        </Button>
                    </DeletionAlertDialog>
                )}
            </div>

            <div className="flex flex-col gap-4">
                <div className="w-full flex flex-col gap-2">
                    <Label htmlFor="name" className="text-xs font-medium text-muted-foreground uppercase tracking-wider ml-1">
                        Nome do Treino
                    </Label>
                    <Input
                        id="name"
                        name="name"
                        type="text"
                        enterKeyHint="next"
                        data-editor-field="name"
                        aria-invalid={!!nameError}
                        aria-describedby={nameError ? "name-error" : undefined}
                        placeholder="Ex.: Treino A - Foco Peito"
                        className={cn("h-12 text-lg font-medium tracking-tight", nameError && "border-destructive")}
                        value={name}
                        onChange={(e) => {
                            setWorkoutInfo("name", e.target.value);
                            onNameChange?.(e.target.value);
                        }}
                        onBlur={(e) => onNameBlur?.(e.target.value)}
                        onKeyDown={handleFieldKeyDown}
                    />
                    {nameError && <p id="name-error" role="alert" className="text-destructive text-[12px] mt-1">{nameError}</p>}
                </div>
                <div className="w-full flex flex-col gap-2">
                    <Label htmlFor="description" className="text-xs font-medium text-muted-foreground uppercase tracking-wider ml-1">
                        Descrição
                    </Label>
                    <Textarea
                        id="description"
                        name="description"
                        placeholder="Foco em cadência..."
                        className="min-h-[100px] resize-none"
                        value={description}
                        onChange={(e) => setWorkoutInfo("description", e.target.value)}
                    />
                </div>
                <div className="w-full flex flex-col gap-2">
                    <span id="tracking-mode-label" className="text-xs font-medium text-muted-foreground uppercase tracking-wider ml-1">
                        Como registrar
                    </span>
                    <div role="group" aria-labelledby="tracking-mode-label" className="grid grid-cols-2 gap-2">
                        {TRACKING_MODES.map((mode) => (
                            <button
                                key={mode.value}
                                type="button"
                                aria-pressed={trackingMode === mode.value}
                                onClick={() => setTrackingMode(mode.value)}
                                className={cn(
                                    "min-h-11 rounded-md border px-3 py-2 text-[14px] font-medium transition-colors",
                                    trackingMode === mode.value
                                        ? "border-primary bg-primary/10 text-foreground"
                                        : "border-border text-muted-foreground"
                                )}
                            >
                                {mode.label}
                            </button>
                        ))}
                    </div>
                    <p className="text-[12px] text-muted-foreground ml-1">
                        {TRACKING_MODES.find((mode) => mode.value === trackingMode)?.description}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default WorkoutInfo;