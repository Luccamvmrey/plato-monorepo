import { Label } from "@/components/ui/label.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Button } from "@/components/ui/button.tsx";
import { ArrowLeft, Trash2 } from "lucide-react";
import DeletionAlertDialog from "@/core/components/DeletionAlertDialog.tsx";
import { useWorkoutInfoLogic } from "@/features/workouts/hooks/useWorkoutInfoLogic.ts";

const WorkoutInfo = () => {
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
        <div className="bg-card flex flex-col justify-between gap-6 p-4 rounded-xl border">
            <div className="flex w-full items-center justify-between">
                <span className="font-semibold text-2xl">{title} Treino</span>

                {id === "new" ? (
                    <Button variant="outline" type="button"  onClick={handleBack}>
                        <ArrowLeft/>
                        Cancelar
                    </Button>
                ) : (
                    <DeletionAlertDialog onConfirm={handleDelete}>
                        <Button variant="destructive" type="button">
                            <Trash2/>
                            Apagar
                        </Button>
                    </DeletionAlertDialog>
                )}
            </div>

            <div className="w-full flex flex-col gap-2">
                <Label htmlFor="name">Nome do Treino</Label>
                <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Ex.: Treino A - Foco Peito"
                    className="h-12"
                    value={name}
                    onChange={(e) => setWorkoutInfo("name", e.target.value)}
                />
            </div>
            <div className="w-full flex flex-col gap-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                    id="description"
                    name="description"
                    placeholder="Foco em cadência..."
                    value={description}
                    onChange={(e) => setWorkoutInfo("description", e.target.value)}
                />
            </div>
        </div>
    );
};

export default WorkoutInfo;