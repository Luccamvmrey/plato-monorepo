import { useQuery } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { MuscleBadge } from "@/core/components/MuscleBadge";
import { ExerciseService } from "@/features/workouts/services/exercise.service.ts";
import { ALTERNATIVE_REASON_LABEL, describeExercise } from "@/features/workouts/utils/movement.ts";
import type { Exercise } from "@/features/workouts/workout.types.ts";

type AlternativesSheetProps = {
    /** Exercício a substituir. `null` mantém a sheet fechada. */
    target: Exercise | null;
    onClose: () => void;
    /** Quem decide o que fazer com a escolha — o editor troca no rascunho, a sessão chama a API. */
    onSelect: (exercise: Exercise) => void;
    isPending?: boolean;
};

/**
 * Recebe o alvo e o `onSelect` por prop em vez de falar com a store do editor: a mesma
 * sheet serve para trocar um exercício do plano e para trocar dentro da sessão ativa,
 * que são destinos completamente diferentes para a mesma escolha.
 */
const AlternativesSheet = ({ target, onClose, onSelect, isPending }: AlternativesSheetProps) => {
    const { data, isLoading } = useQuery({
        queryKey: ["exercise-alternatives", target?.id],
        queryFn: () => ExerciseService.getAlternatives(target!.id),
        enabled: !!target,
        staleTime: Infinity,
    });

    return (
        <Sheet open={!!target} onOpenChange={(next) => !next && onClose()}>
            {/* `SheetContent` não tem padding próprio (a base só declara gap-4), então
                quem pagina é cada bloco — mesma estrutura da NewExerciseSheet. */}
            <SheetContent
                side="bottom"
                className="max-h-[85dvh] p-0 gap-0 flex flex-col rounded-t-3xl overflow-hidden"
            >
                {/* pr-12 abre espaço para o X de fechar, que é posicionado por cima. */}
                <SheetHeader className="px-6 pt-6 pb-4 pr-12 shrink-0 border-b border-border/50">
                    <SheetTitle className="text-base">
                        Alternativas para {target?.name}
                    </SheetTitle>
                    {target && (
                        <p className="text-xs text-muted-foreground">
                            {describeExercise(target) || "Sem classificação de movimento"}
                        </p>
                    )}
                </SheetHeader>

                {/* pb-8: sem isso a última linha encosta na borda inferior da tela. */}
                <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 pb-8 flex flex-col gap-2">
                    {isLoading && (
                        <div className="flex justify-center py-8">
                            <Spinner />
                        </div>
                    )}

                    {!isLoading && data?.alternatives.length === 0 && (
                        <p className="text-[13px] text-muted-foreground text-center py-8">
                            Nenhum equivalente encontrado no catálogo.
                        </p>
                    )}

                    {data?.alternatives.map((alternative) => (
                        <div
                            key={alternative.id}
                            className="flex items-center gap-3 px-3 py-3 rounded-xl border border-border bg-card"
                        >
                            <div className="flex-1 min-w-0 flex flex-col gap-1">
                                <span className="text-sm font-medium tracking-tight truncate">
                                    {alternative.name}
                                </span>
                                {/* O motivo é a informação que falta numa lista crua:
                                    sem ele o usuário não tem como julgar a sugestão. */}
                                <span className="text-[11px] text-muted-foreground">
                                    {ALTERNATIVE_REASON_LABEL[alternative.reason]}
                                    {alternative.recordedSets > 0 && ` · ${alternative.recordedSets} séries já registradas`}
                                </span>
                            </div>

                            <MuscleBadge muscle={alternative.targetMuscle} className="scale-90 shrink-0" />

                            <Button
                                size="sm"
                                variant="secondary"
                                disabled={isPending}
                                className="h-9 px-3 shrink-0 relative tap-target"
                                onClick={() => onSelect(alternative)}
                            >
                                Trocar
                            </Button>
                        </div>
                    ))}
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default AlternativesSheet;
