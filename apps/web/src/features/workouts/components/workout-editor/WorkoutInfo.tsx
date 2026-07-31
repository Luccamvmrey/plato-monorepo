import { Label } from "@/components/ui/label.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Trash2, X } from "lucide-react";
import DeletionAlertDialog from "@/core/components/DeletionAlertDialog.tsx";
import { useWorkoutInfoLogic } from "@/features/workouts/hooks/useWorkoutInfoLogic.ts";
import { focusNextField } from "@/core/utils/focus.ts";
import { cn } from "@/lib/utils";
import type { KeyboardEvent } from "react";

interface WorkoutInfoProps {
    nameError?: string;
    onNameBlur?: (value: string) => void;
    onNameChange?: (value: string) => void;
}

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
            </div>
        </div>
    );
};

export default WorkoutInfo;