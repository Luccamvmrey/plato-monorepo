import { useDeferredValue, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { MuscleBadge } from "@/core/components/MuscleBadge";
import { useExercises } from "@/features/workouts/hooks/useExercises.ts";
import { describeExercise } from "@/features/workouts/utils/movement.ts";
import type { Exercise } from "@/features/workouts/workout.types.ts";

type ExercisePickerSheetProps = {
    title: string;
    triggerLabel: string;
    onSelect: (exercise: Exercise) => void;
    isPending?: boolean;
};

/**
 * Picker de catálogo para escolher UM exercício.
 *
 * Separado do `NewExerciseSheet` do editor de propósito: aquele é multi-seleção com
 * lista de escolhidos e escreve na store do editor. Aqui a escolha é única e imediata
 * — reaproveitar exigiria parametrizar seleção, confirmação e destino ao mesmo tempo,
 * o que deixaria os dois piores.
 */
const ExercisePickerSheet = ({ title, triggerLabel, onSelect, isPending }: ExercisePickerSheetProps) => {
    const { exercisesQuery } = useExercises();
    const { data: exercises, isLoading } = exercisesQuery;

    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    // Input controlado e instantâneo; só a lista filtrada atrasa um frame. Mesmo
    // padrão do picker do editor — sem timer e sem o atraso fixo de um debounce.
    const deferredSearch = useDeferredValue(search);

    const filtered = useMemo(() => {
        const term = deferredSearch.trim().toLowerCase();
        if (!term) return exercises ?? [];

        return (exercises ?? []).filter((exercise) => exercise.name.toLowerCase().includes(term));
    }, [exercises, deferredSearch]);

    // Todo caminho de saída passa por aqui, senão a busca vaza para a próxima abertura.
    const handleOpenChange = (next: boolean) => {
        if (!next) setSearch("");
        setOpen(next);
    };

    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetTrigger asChild>
                <Button
                    variant="outline"
                    className="w-full h-12 mt-1 border-dashed gap-2 text-muted-foreground font-normal"
                >
                    <Plus className="size-4" />
                    {triggerLabel}
                </Button>
            </SheetTrigger>

            {/* `SheetContent` não tem padding próprio (a base só declara gap-4), então
                quem pagina é cada bloco — mesma estrutura da NewExerciseSheet. */}
            <SheetContent
                side="bottom"
                className="max-h-[85dvh] p-0 gap-0 flex flex-col rounded-t-3xl overflow-hidden"
                // Sem isto o Radix foca o input ao abrir e o teclado sobe junto,
                // cobrindo a lista que a pessoa veio ver.
                onOpenAutoFocus={(event) => event.preventDefault()}
            >
                {/* pr-12 abre espaço para o X de fechar, que é posicionado por cima. */}
                <SheetHeader className="px-6 pt-6 pb-4 pr-12 shrink-0 gap-3 border-b border-border/50">
                    <SheetTitle className="text-base">{title}</SheetTitle>

                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Buscar exercício"
                        className="shrink-0"
                    />
                </SheetHeader>

                {/* pb-8: sem isso a última linha encosta na borda inferior da tela. */}
                <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 pb-8 flex flex-col gap-2">
                    {isLoading && (
                        <div className="flex justify-center py-8"><Spinner /></div>
                    )}

                    {!isLoading && filtered.length === 0 && (
                        <p className="text-[13px] text-muted-foreground text-center py-8">
                            Nenhum exercício encontrado.
                        </p>
                    )}

                    {filtered.map((exercise) => (
                        <button
                            key={exercise.id}
                            disabled={isPending}
                            onClick={() => {
                                onSelect(exercise);
                                handleOpenChange(false);
                            }}
                            className="flex items-center gap-3 px-3 py-3 rounded-xl border border-border bg-card text-left transition-colors hover:bg-muted/40 disabled:opacity-50"
                        >
                            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                <span className="text-sm font-medium tracking-tight truncate">
                                    {exercise.name}
                                </span>
                                {describeExercise(exercise) && (
                                    <span className="text-[11px] text-muted-foreground">
                                        {describeExercise(exercise)}
                                    </span>
                                )}
                            </div>
                            <MuscleBadge muscle={exercise.targetMuscle} className="scale-90 shrink-0" />
                        </button>
                    ))}
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default ExercisePickerSheet;
