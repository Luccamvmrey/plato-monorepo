import { motion, type Variants } from "framer-motion";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { InlineErrorBanner } from "@/core/components/InlineErrorBanner";
import { useKeyboardOpen } from "@/core/hooks/useKeyboardOpen.ts";
import { useProgramEditorLogic } from "@/features/workouts/hooks/useProgramEditorLogic.ts";
import ProgramCycleEditor from "@/features/workouts/components/program/ProgramCycleEditor.tsx";
import { cn } from "@/lib/utils.ts";

const enterAnimation: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 380, damping: 28, delay: 0.04 },
    },
};

const ProgramEditorPage = () => {
    const {
        isNew,
        name,
        setName,
        description,
        setDescription,
        selectedWorkouts,
        availableWorkouts,
        addWorkout,
        removeWorkout,
        moveWorkout,
        handleSubmit,
        handleCancel,
        canSubmit,
        isPending,
        isLoading,
        submitError,
    } = useProgramEditorLogic();

    const isKeyboardOpen = useKeyboardOpen();

    if (isLoading) {
        return (
            <div className="flex flex-col gap-4 mt-4">
                <Skeleton className="h-[52px] w-full rounded-xl" />
                <Skeleton className="h-[92px] w-full rounded-xl" />
                <Skeleton className="h-[220px] w-full rounded-xl" />
            </div>
        );
    }

    return (
        <motion.div
            variants={enterAnimation}
            initial="hidden"
            animate="show"
            className="h-full flex flex-col gap-5 mb-[100px]"
        >
            <div className="flex flex-row items-center gap-1 py-2">
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full relative tap-target -ml-2"
                    onClick={handleCancel}
                    aria-label="Voltar para programas"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-xl font-medium tracking-tight">
                    {isNew ? "Novo programa" : "Editar programa"}
                </h1>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <Label htmlFor="program-name">Nome</Label>
                    <Input
                        id="program-name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Rotação A–E"
                        autoComplete="off"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <Label htmlFor="program-description">Descrição (opcional)</Label>
                    <Textarea
                        id="program-description"
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        placeholder="Push / Pull / Legs, 5 treinos"
                        rows={2}
                    />
                </div>
            </div>

            <ProgramCycleEditor
                selectedWorkouts={selectedWorkouts}
                availableWorkouts={availableWorkouts}
                onAdd={addWorkout}
                onRemove={removeWorkout}
                onMove={moveWorkout}
            />

            {submitError && <InlineErrorBanner message={submitError} />}

            {/* Mesmo padrão da WorkoutEditorActions: barra fixa acima da NavBar, que
                some com o teclado aberto — salvar nunca é a próxima ação enquanto se
                digita o nome, e é justamente essa faixa que o teclado oclui. */}
            <div
                className={cn(
                    "fixed bottom-navbar inset-x-0 p-4 pb-3 bg-background/95 backdrop-blur-sm border-t border-border",
                    isKeyboardOpen && "hidden"
                )}
            >
                <Button
                    className="w-full h-14 rounded-xl font-medium tracking-tight gap-2"
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                >
                    {isPending ? <Spinner data-icon="inline-start" /> : <Save data-icon="inline-start" />}
                    {isPending ? "Salvando..." : isNew ? "Criar programa" : "Salvar programa"}
                </Button>
            </div>
        </motion.div>
    );
};

export default ProgramEditorPage;
