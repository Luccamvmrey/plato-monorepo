import { useQuery } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { MuscleBadge } from "@/core/components/MuscleBadge";
import { ExerciseService } from "@/features/workouts/services/exercise.service.ts";
import { useWorkoutEditorStore } from "@/features/workouts/stores/workout-editor.store.ts";
import { ALTERNATIVE_REASON_LABEL, describeExercise } from "@/features/workouts/utils/movement.ts";
import type { WorkoutExerciseDraft } from "@/features/workouts/stores/workout-editor.store.ts";

type AlternativesSheetProps = {
    draft: WorkoutExerciseDraft | null;
    onClose: () => void;
};

const AlternativesSheet = ({ draft, onClose }: AlternativesSheetProps) => {
    const replaceExercise = useWorkoutEditorStore((state) => state.replaceExercise);

    const { data, isLoading } = useQuery({
        queryKey: ["exercise-alternatives", draft?.exercise.id],
        queryFn: () => ExerciseService.getAlternatives(draft!.exercise.id),
        enabled: !!draft,
        staleTime: Infinity,
    });

    return (
        <Sheet open={!!draft} onOpenChange={(next) => !next && onClose()}>
            <SheetContent side="bottom" className="max-h-[85dvh] flex flex-col">
                <SheetHeader>
                    <SheetTitle className="text-base">
                        Alternativas para {draft?.exercise.name}
                    </SheetTitle>
                    {draft && (
                        <p className="text-xs text-muted-foreground">
                            {describeExercise(draft.exercise) || "Sem classificação de movimento"}
                        </p>
                    )}
                </SheetHeader>

                <div className="flex-1 overflow-y-auto flex flex-col gap-2 py-2">
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
                                className="h-9 px-3 shrink-0 relative tap-target"
                                onClick={() => {
                                    replaceExercise(draft!.instanceId, alternative);
                                    onClose();
                                }}
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
